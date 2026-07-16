import {
  BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get,
  Injectable, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { prisma } from '@maqserv/db';
import { passwordGrant, verifySupabaseToken } from '../common/supabase-auth';

/**
 * Auth de ADMINISTRADORES vía Supabase Auth. Los admins se importaron a auth.users
 * con app_metadata.role='admin' y app_metadata.app_admin_id. Un token de cliente
 * (role='customer') jamás pasa el AdminGuard.
 */

export interface AdminRequest {
  headers: Record<string, string | undefined>;
  adminId: number;
}

/**
 * Caché corta de "esta cuenta sigue activa".
 *
 * El guard consultaba `admins` en CADA petición, y cada consulta a Supabase cuesta un
 * viaje de red (~65-100 ms): lo pagaba cada pantalla del panel, varias veces. Se guarda
 * el resultado unos segundos.
 *
 * Por qué NO rompe lo que arreglaba: la consulta existe para que "Desactivar" corte a
 * quien ya está dentro (antes seguía trabajando indefinidamente porque el token de
 * Supabase no sabe nada de `admins.status`). Con la caché sigue cortando — dentro de
 * ADMIN_TTL_MS. 10 segundos para una persona es "al instante", y a cambio el panel se
 * ahorra un viaje por petición.
 */
const ADMIN_TTL_MS = 10_000;

/** Lo que el panel necesita saber de quien está dentro. */
interface CachedAdmin {
  id: number;
  name: string;
  email: string;
  role: string | null;
}
const activeCache = new Map<number, { until: number; admin: CachedAdmin }>();

/** Lo llama cualquier sitio que desactive/borre un admin: la caché no debe sobrevivirlo. */
export function forgetAdmin(id: number): void {
  activeCache.delete(id);
}

/**
 * La cuenta activa, de la caché o de la BD. Fuente ÚNICA para el guard y para
 * `/admin/auth/me`: cada página del panel llama a `me()` antes de pedir sus datos, así
 * que sin esto toda pantalla pagaba dos viajes a la BD en fila (uno del guard y otro de
 * `me`) antes de empezar.
 *
 * @returns null si no existe o está desactivada.
 */
async function activeAdmin(id: number): Promise<CachedAdmin | null> {
  const hit = activeCache.get(id);
  if (hit && hit.until > Date.now()) return hit.admin;

  const a = await prisma.admins.findFirst({
    where: { id, status: 1 },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!a) {
    activeCache.delete(id);
    return null;
  }
  activeCache.set(id, { until: Date.now() + ADMIN_TTL_MS, admin: a });
  return a;
}

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Falta el token');
    let id: number;
    try {
      const claims = await verifySupabaseToken(token);
      if (claims.app_metadata?.role !== 'admin') throw new Error('no admin');
      const claimed = claims.app_metadata?.app_admin_id;
      if (typeof claimed !== 'number') throw new Error('sin app_admin_id');
      id = claimed;
    } catch {
      throw new UnauthorizedException('Token de administrador inválido');
    }

    /**
     * `status` se comprueba en CADA petición, no solo al entrar: el token es de Supabase
     * y no sabe nada de `admins.status`; el middleware del panel lo renueva solo con el
     * refresh token. Sin esto, "Desactivar" no cortaba a quien ya estaba dentro.
     * La caché (ver arriba) evita pagar el viaje a la BD en cada petición.
     */
    if (!(await activeAdmin(id))) {
      throw new UnauthorizedException('Tu cuenta de administrador está desactivada');
    }
    req.adminId = id;
    return true;
  }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

@Controller('admin/auth')
export class AdminAuthController {
  // La puerta del panel: pocos usuarios, ninguna razón para intentar 10 veces por
  // minuto, y el premio de entrar es todo el negocio.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  async login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const session = await passwordGrant(parsed.data.email, parsed.data.password);
    if (!session.access_token) throw new UnauthorizedException('Correo o contraseña incorrectos');
    if (session.user?.app_metadata?.role !== 'admin') {
      throw new UnauthorizedException('Esta cuenta no es de administrador');
    }
    const a = await prisma.admins.findFirst({ where: { email: parsed.data.email, status: 1 } });
    if (!a) throw new UnauthorizedException('Correo o contraseña incorrectos');
    return {
      token: session.access_token,
      refresh_token: session.refresh_token,
      admin: { id: a.id, name: a.name, email: a.email, role: a.role },
    };
  }

  /**
   * Lo llama CADA página del panel antes de pedir sus datos. Sale de la misma caché que
   * usó el guard un instante antes (`activeAdmin`), así que no cuesta ningún viaje a la
   * BD: antes eran dos por pantalla, en fila, solo para saber quién eres.
   */
  @Get('me')
  @UseGuards(AdminGuard)
  async me(@Req() req: AdminRequest) {
    const a = await activeAdmin(req.adminId);
    if (!a) throw new UnauthorizedException();
    return a;
  }
}
