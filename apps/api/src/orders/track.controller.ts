import { BadRequestException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { prisma } from '@maqserv/db';
import type { TrackingResult } from '@maqserv/types';
import { FulfillmentService, toShipping } from './fulfillment.service';
import { hasRentalItems, parseCart } from './cart.util';

/**
 * Rastreo PÚBLICO de pedidos (como el /track del legacy):
 * número de orden + email del cliente como verificación ligera.
 */
@Controller('track')
export class TrackController {
  constructor(private readonly fulfillment: FulfillmentService) {}

  /**
   * 10 por minuto: sin sesión de por medio, esto es un par (número, correo) que se puede
   * probar a ciegas, y responde distinto cuando acierta. Un cliente real consulta su
   * pedido un par de veces; 10 no le estorban y sí matan la prueba por fuerza bruta.
   */
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Get()
  async track(@Query('number') number?: string, @Query('email') email?: string): Promise<TrackingResult> {
    if (!number?.trim() || !email?.trim()) {
      throw new BadRequestException('Número de orden y correo requeridos');
    }
    const order = await prisma.orders.findFirst({
      where: { order_number: number.trim(), customer_email: email.trim() },
    });
    if (!order) throw new NotFoundException('No encontramos un pedido con esos datos');

    // `rastreos` son las guías cargadas en el sistema VIEJO; el módulo de envíos usa
    // `order_events`. Se mandan las dos: las órdenes de 2021 solo tienen las primeras.
    const [entries, events] = await Promise.all([
      prisma.rastreos.findMany({ where: { order_id: order.id }, orderBy: { id: 'desc' } }),
      this.fulfillment.events(order.id),
    ]);

    return {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at ? order.created_at.toISOString() : null,
      shipping: toShipping(order),
      hasRental: hasRentalItems(parseCart(order.cart).items),
      events,
      entries: entries.map((e) => ({
        numTracking: e.num_tracking,
        nota: e.nota,
        fechaEntrega: e.fecha_entrega.toISOString().slice(0, 10),
        status: e.status,
      })),
    };
  }
}
