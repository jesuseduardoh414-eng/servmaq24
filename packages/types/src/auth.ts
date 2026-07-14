/** DTOs de autenticación (F2). */

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
}

export interface AuthResponse {
  token: string;
  /** Refresh token de Supabase (para renovar el access token de 1h). */
  refresh_token?: string;
  user: AuthUser;
}
