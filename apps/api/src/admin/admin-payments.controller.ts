import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { prisma } from '@maqserv/db';
import { AdminGuard } from './admin-auth';

const gatewaySchema = z.object({
  title: z.string().min(2).max(190).optional(),
  text: z.string().max(20000).optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
  /** Credencial del proveedor. '' borra la guardada. Nunca se devuelve al leer. */
  secret: z.string().max(500).optional(),
});

/**
 * Métodos de pago (Panel → Pagos).
 * SEGURIDAD: el `secret` (p. ej. access token de MercadoPago) NUNCA se devuelve;
 * solo se informa si existe (`hasSecret`).
 */
@Controller('admin/payments')
@UseGuards(AdminGuard)
export class AdminPaymentsController {
  @Get('gateways')
  async gateways() {
    const rows = await prisma.payment_gateways.findMany({ orderBy: { id: 'asc' } });

    /**
     * A dónde avisa MercadoPago cuando alguien paga. Se manda como `notification_url`
     * en cada preferencia (ver `payments.service`), así que no hay que configurarlo en
     * el panel de MP — pero **MP tiene que poder alcanzarla desde internet**. En local
     * apunta a localhost y NUNCA llega: el pago se hace y la orden se queda sin marcar.
     * Por eso se expone aquí, con el aviso.
     */
    const apiUrl = (process.env.API_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');
    const webhookUrl = `${apiUrl}/payments/mercadopago/webhook`;
    const webhookReachable = !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(apiUrl);

    return rows.map((r) => ({
      id: r.id,
      code: r.code ?? '',
      title: r.title,
      text: r.text ?? '',
      status: r.status,
      hasSecret: Boolean(r.secret && r.secret.trim()),
      ...(r.code === 'mercadopago' ? { webhookUrl, webhookReachable } : {}),
    }));
  }

  @Patch('gateways/:id')
  async updateGateway(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = gatewaySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const exists = await prisma.payment_gateways.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    const d = parsed.data;
    await prisma.payment_gateways.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.text !== undefined ? { text: d.text } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        // '' → null (borra la credencial); undefined → no se toca
        ...(d.secret !== undefined ? { secret: d.secret.trim() ? d.secret.trim() : null } : {}),
      },
    });
    return { ok: true };
  }
}
