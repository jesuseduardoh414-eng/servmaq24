import { BadRequestException, Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { prisma } from '@maqserv/db';
import type { TrackingResult } from '@maqserv/types';

/**
 * Rastreo PÚBLICO de pedidos (como el /track del legacy):
 * número de orden + email del cliente como verificación ligera.
 */
@Controller('track')
export class TrackController {
  @Get()
  async track(@Query('number') number?: string, @Query('email') email?: string): Promise<TrackingResult> {
    if (!number?.trim() || !email?.trim()) {
      throw new BadRequestException('Número de orden y correo requeridos');
    }
    const order = await prisma.orders.findFirst({
      where: { order_number: number.trim(), customer_email: email.trim() },
    });
    if (!order) throw new NotFoundException('No encontramos un pedido con esos datos');

    const entries = await prisma.rastreos.findMany({
      where: { order_id: order.id },
      orderBy: { id: 'desc' },
    });

    return {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at ? order.created_at.toISOString() : null,
      entries: entries.map((e) => ({
        numTracking: e.num_tracking,
        nota: e.nota,
        fechaEntrega: e.fecha_entrega.toISOString().slice(0, 10),
        status: e.status,
      })),
    };
  }
}
