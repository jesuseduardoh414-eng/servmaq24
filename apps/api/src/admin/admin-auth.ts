import {
  BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get,
  Injectable, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
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

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Falta el token');
    try {
      const claims = await verifySupabaseToken(token);
      if (claims.app_metadata?.role !== 'admin') throw new Error('no admin');
      const id = claims.app_metadata?.app_admin_id;
      if (typeof id !== 'number') throw new Error('sin app_admin_id');
      req.adminId = id;
      return true;
    } catch {
      throw new UnauthorizedException('Token de administrador inválido');
    }
  }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

@Controller('admin/auth')
export class AdminAuthController {
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

  @Get('me')
  @UseGuards(AdminGuard)
  async me(@Req() req: AdminRequest) {
    const a = await prisma.admins.findUnique({ where: { id: req.adminId } });
    if (!a) throw new UnauthorizedException();
    return { id: a.id, name: a.name, email: a.email, role: a.role };
  }
}
