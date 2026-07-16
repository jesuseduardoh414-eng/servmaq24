import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@maqserv/db';
import type { AuthResponse, AuthUser } from '@maqserv/types';
import { adminCreateUser, adminSetMetadata, passwordGrant, refreshGrant, sendPasswordReset } from '../common/supabase-auth';

/**
 * Auth de CLIENTES vía Supabase Auth. Los usuarios legacy se importaron a auth.users
 * con su hash bcrypt (entran con su contraseña de siempre). El JWT de Supabase lleva
 * app_metadata.app_user_id, que los guards mapean a users.id.
 */
@Injectable()
export class AuthService {
  private toAuthUser(u: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
    residency?: string | null;
    created_at?: Date | null;
  }): AuthUser {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      city: u.city,
      zip: u.zip,
      residency: u.residency ?? null,
      createdAt: u.created_at ? u.created_at.toISOString() : null,
    };
  }

  async register(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const exists = await prisma.users.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese correo');

    // 1) crea la identidad en Supabase Auth, 2) la fila de la app, 3) enlaza id en el metadata
    const authUser = await adminCreateUser(input.email, input.password, { role: 'customer' });
    const u = await prisma.users.create({
      data: {
        name: input.name,
        email: input.email,
        auth_id: authUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    await adminSetMetadata(authUser.id, { role: 'customer', app_user_id: u.id });

    const session = await passwordGrant(input.email, input.password);
    const token = session.access_token;
    if (!token) throw new UnauthorizedException('No se pudo iniciar sesión tras el registro');
    return { token, refresh_token: session.refresh_token, user: this.toAuthUser(u) };
  }

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const session = await passwordGrant(input.email, input.password);
    const token = session.access_token;
    if (!token) throw new UnauthorizedException('Correo o contraseña incorrectos');
    const appUserId = session.user?.app_metadata?.app_user_id;
    const u =
      typeof appUserId === 'number'
        ? await prisma.users.findUnique({ where: { id: appUserId } })
        : await prisma.users.findUnique({ where: { email: input.email } });
    if (!u) throw new UnauthorizedException('Correo o contraseña incorrectos');
    return { token, refresh_token: session.refresh_token, user: this.toAuthUser(u) };
  }

  /** Renueva el access token (1h) con el refresh token de Supabase. */
  async refresh(refresh_token: string): Promise<{ token: string; refresh_token?: string }> {
    const session = await refreshGrant(refresh_token);
    const token = session.access_token;
    if (!token) throw new UnauthorizedException('Sesión expirada');
    return { token, refresh_token: session.refresh_token };
  }

  async me(userId: number): Promise<AuthUser> {
    const u = await prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new UnauthorizedException();
    return this.toAuthUser(u);
  }

  /** Solicita restablecer contraseña (envía correo por Supabase). Siempre ok (anti-enumeración). */
  async forgotPassword(email: string, redirectTo?: string): Promise<{ ok: boolean }> {
    return sendPasswordReset(email, redirectTo);
  }
}
