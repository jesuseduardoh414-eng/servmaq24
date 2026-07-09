import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@servmaq/db';

export interface FreightDistance {
  km: number;
  text: string;
}

/**
 * Distancia para flete con Google Distance Matrix (réplica del legacy):
 * origen = dirección de la empresa (generalsettings.street),
 * destino = dirección del cliente.
 * Sin GOOGLE_DISTANCE_MATRIX_API_KEY (pendiente rotación) degrada a null →
 * el flete usa la tarifa base por producto, igual que el legacy sin distancia.
 */
@Injectable()
export class FreightService {
  private readonly logger = new Logger(FreightService.name);

  async distanceTo(destination: string): Promise<FreightDistance | null> {
    const apiKey = process.env.GOOGLE_DISTANCE_MATRIX_API_KEY;
    if (!apiKey || !destination.trim()) return null;

    const gs = await prisma.generalsettings.findFirst({ select: { street: true } });
    const origin = gs?.street?.trim();
    if (!origin) return null;

    try {
      const params = new URLSearchParams({
        origins: origin,
        destinations: destination,
        key: apiKey,
        units: 'metric',
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        status: string;
        rows?: Array<{ elements?: Array<{ distance?: { text: string; value: number } }> }>;
      };
      const el = data.rows?.[0]?.elements?.[0];
      if (data.status !== 'OK' || !el?.distance) return null;
      // Igual que el legacy: metros → km, mínimo 0.01 si hay distancia
      const km = Math.max(0.01, Math.round((el.distance.value / 1000) * 100) / 100);
      return { km, text: el.distance.text };
    } catch (err) {
      this.logger.warn(`Distance Matrix falló: ${(err as Error).message}`);
      return null;
    }
  }
}
