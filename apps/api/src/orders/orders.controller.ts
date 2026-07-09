import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { CheckoutResult } from '@servmaq/types';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtGuard, type AuthedRequest } from '../auth/jwt.guard';

const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(999) })).min(1),
  method: z.enum(['transferencia', 'mercadopago']),
  customer: z.object({
    name: z.string().min(2).max(190),
    email: z.string().email().max(190),
    phone: z.string().min(7).max(30),
    address: z.string().min(4).max(250),
    city: z.string().min(2).max(100),
    zip: z.string().min(3).max(12),
  }),
  note: z.string().max(1000).optional(),
});

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @Post()
  async checkout(@Req() req: AuthedRequest, @Body() body: unknown): Promise<CheckoutResult> {
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    }

    const { order } = await this.orders.create(req.userId, parsed.data);

    if (parsed.data.method === 'mercadopago') {
      const redirectUrl = await this.payments.createMercadoPagoRedirect(order);
      return { order, redirectUrl, instructions: null };
    }

    const methods = await this.payments.methods();
    const transferencia = methods.find((m) => m.id === 'transferencia');
    return { order, redirectUrl: null, instructions: transferencia?.instructions ?? null };
  }

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.orders.listByUser(req.userId);
  }

  @Get(':orderNumber')
  byNumber(@Req() req: AuthedRequest, @Param('orderNumber') orderNumber: string) {
    return this.orders.byNumber(req.userId, orderNumber);
  }
}
