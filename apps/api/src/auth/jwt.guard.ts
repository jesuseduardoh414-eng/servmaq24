import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifySupabaseToken } from '../common/supabase-auth';

/** Forma mínima del request que necesitamos (evita depender de @types/express). */
export interface AuthedRequest {
  headers: Record<string, string | undefined>;
  userId: number;
}

/**
 * Valida el access token de Supabase (JWKS ES256) y extrae el id de la app
 * desde app_metadata.app_user_id (inyectado al importar/crear el usuario).
 */
@Injectable()
export class JwtGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Falta el token');
    try {
      const claims = await verifySupabaseToken(token);
      const uid = claims.app_metadata?.app_user_id;
      if (typeof uid !== 'number') throw new Error('token sin app_user_id');
      req.userId = uid;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
