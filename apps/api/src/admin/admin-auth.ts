import {
  BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get,
  Injectable, Post, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@servmaq/db';

/**
 * Auth de ADMINISTRADORES: tabla legacy `admins` (separada de users),
 * mismos hashes bcrypt. El JWT lleva claim `adm: true` — un token de
 * cliente jamás pasa el AdminGuard.
 */

export interface AdminRequest {
  headers: Record<string, string | undefined>;
  adminId: number;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Falta el token');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number; adm?: boolean }>(token);
      if (!payload.adm) throw new Error('no admin');
      req.adminId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token de administrador inválido');
    }
  }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly jwt: JwtService) {}

  @Post('login')
  async login(@Body() body: unknown) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const a = await prisma.admins.findFirst({ where: { email: parsed.data.email, status: 1 } });
    if (!a || !(await bcrypt.compare(parsed.data.password, a.password))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    const token = await this.jwt.signAsync({ sub: a.id, adm: true });
    return { token, admin: { id: a.id, name: a.name, email: a.email, role: a.role } };
  }

  @Get('me')
  @UseGuards(AdminGuard)
  async me(@Req() req: AdminRequest) {
    const a = await prisma.admins.findUnique({ where: { id: req.adminId } });
    if (!a) throw new UnauthorizedException();
    return { id: a.id, name: a.name, email: a.email, role: a.role };
  }
}
