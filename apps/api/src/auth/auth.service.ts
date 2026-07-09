import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@servmaq/db';
import type { AuthResponse, AuthUser } from '@servmaq/types';

/**
 * Auth compatible con el legacy: la tabla `users` guarda hashes bcrypt de
 * Laravel ($2y$) que bcryptjs verifica sin cambios → los clientes existentes
 * entran con su contraseña de siempre. Hashes nuevos: $2b$ cost 10.
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  private toAuthUser(u: { id: number; name: string; email: string; phone: string | null; address: string | null; city: string | null; zip: string | null }): AuthUser {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
      city: u.city,
      zip: u.zip,
    };
  }

  private async issue(user: AuthUser): Promise<AuthResponse> {
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { token, user };
  }

  async register(input: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const exists = await prisma.users.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese correo');

    const hash = await bcrypt.hash(input.password, 10);
    const u = await prisma.users.create({
      data: {
        name: input.name,
        email: input.email,
        password: hash,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return this.issue(this.toAuthUser(u));
  }

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const u = await prisma.users.findUnique({ where: { email: input.email } });
    // Mensaje único para credenciales inválidas: no revelar si el correo existe
    if (!u?.password) throw new UnauthorizedException('Correo o contraseña incorrectos');
    const ok = await bcrypt.compare(input.password, u.password);
    if (!ok) throw new UnauthorizedException('Correo o contraseña incorrectos');
    return this.issue(this.toAuthUser(u));
  }

  async me(userId: number): Promise<AuthUser> {
    const u = await prisma.users.findUnique({ where: { id: userId } });
    if (!u) throw new UnauthorizedException();
    return this.toAuthUser(u);
  }
}
