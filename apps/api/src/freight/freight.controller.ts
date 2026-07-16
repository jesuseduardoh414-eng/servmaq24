import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { FreightService } from './freight.service';

const quoteInput = z.object({
  address: z.string().max(300).optional(),
  items: z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(999) }))
    .max(50)
    .optional(),
});

/** Cotizador público de traslado: lo usan el carrito y el checkout. */
@Controller('freight')
export class FreightController {
  constructor(private readonly freight: FreightService) {}

  // Cada llamada puede acabar en Google Distance Matrix, que se cobra por uso. 20 por
  // minuto deja al cliente probar direcciones en el carrito sin abrir la llave a nadie.
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('quote')
  async quote(@Body() body: unknown) {
    const parsed = quoteInput.safeParse(body ?? {});
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    return this.freight.quote(parsed.data);
  }
}
