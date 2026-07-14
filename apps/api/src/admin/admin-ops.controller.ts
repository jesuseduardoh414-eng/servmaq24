import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param,
  ParseIntPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { prisma } from '@maqserv/db';
import { AdminGuard } from './admin-auth';

/** Operación diaria: órdenes, cotizaciones, vendedores y retiros. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminOpsController {
  @Get('dashboard')
  async dashboard() {
    const [products, orders, pendingOrders, quotes, pendingQuotes, users, vendorsPending, withdrawsPending] =
      await Promise.all([
        prisma.products.count({ where: { status: 1 } }),
        prisma.orders.count(),
        prisma.orders.count({ where: { status: 'pending' } }),
        prisma.quotes.count(),
        prisma.quotes.count({ where: { status: 'pending' } }),
        prisma.users.count(),
        prisma.users.count({ where: { is_vendor: 1 } }),
        prisma.withdraws.count({ where: { status: 'pending' } }),
      ]);
    return { products, orders, pendingOrders, quotes, pendingQuotes, users, vendorsPending, withdrawsPending };
  }

  // ---- Órdenes ----

  @Get('orders')
  async orders(@Query('page') page?: string, @Query('status') status?: string) {
    const p = Math.max(1, Number(page ?? 1) || 1);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [total, rows] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.findMany({ where, orderBy: { id: 'desc' }, skip: (p - 1) * 20, take: 20 }),
    ]);
    return {
      total, page: p, pages: Math.max(1, Math.ceil(total / 20)),
      items: rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        customer: o.customer_name,
        email: o.customer_email,
        method: o.method,
        total: o.pay_amount,
        status: o.status,
        paymentStatus: o.payment_status,
        createdAt: o.created_at ? o.created_at.toISOString() : null,
      })),
    };
  }

  @Patch('orders/:id')
  async updateOrder(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    // Estados del enum legacy orders_status
    const schema = z.object({
      status: z.enum(['pending', 'processing', 'completed', 'declined']).optional(),
      paymentStatus: z.string().max(50).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const o = await prisma.orders.findUnique({ where: { id } });
    if (!o) throw new NotFoundException();
    await prisma.orders.update({
      where: { id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.paymentStatus ? { payment_status: parsed.data.paymentStatus } : {}),
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  // ---- Cotizaciones ----

  @Get('quotes')
  async quotes(@Query('page') page?: string, @Query('status') status?: string) {
    const p = Math.max(1, Number(page ?? 1) || 1);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [total, rows] = await Promise.all([
      prisma.quotes.count({ where }),
      prisma.quotes.findMany({ where, orderBy: { id: 'desc' }, skip: (p - 1) * 20, take: 20 }),
    ]);
    return {
      total, page: p, pages: Math.max(1, Math.ceil(total / 20)),
      items: rows.map((q) => ({
        id: Number(q.id),
        quoteNumber: q.quote_number,
        name: q.name,
        email: q.email,
        phone: q.phone,
        company: q.company_name,
        subtotal: Number(q.subtotal),
        freightCost: Number(q.freight_cost),
        total: Number(q.total),
        status: q.status,
        comments: q.comments,
        createdAt: q.created_at ? q.created_at.toISOString() : null,
      })),
    };
  }

  /** Responder cotización: ajustar montos/condiciones y marcar completed. */
  @Patch('quotes/:id')
  async updateQuote(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const schema = z.object({
      status: z.enum(['pending', 'completed', 'rejected']).optional(),
      conditions: z.string().max(5000).optional(),
      freightCost: z.coerce.number().min(0).optional(),
      tax: z.coerce.number().min(0).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const q = await prisma.quotes.findUnique({ where: { id } });
    if (!q) throw new NotFoundException();

    const freight = parsed.data.freightCost ?? Number(q.freight_cost);
    const tax = parsed.data.tax ?? Number(q.tax);
    const total = Math.round((Number(q.subtotal) + freight + tax) * 100) / 100;

    await prisma.quotes.update({
      where: { id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.conditions !== undefined ? { conditions: parsed.data.conditions } : {}),
        freight_cost: freight,
        tax,
        total,
        updated_at: new Date(),
      },
    });
    return { ok: true, total };
  }

  // ---- Vendedores ----

  @Get('vendors')
  async vendors() {
    const rows = await prisma.users.findMany({
      where: { is_vendor: { in: [1, 2] } },
      orderBy: { id: 'desc' },
      select: { id: true, name: true, email: true, shop_name: true, is_vendor: true, current_balance: true },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      shopName: u.shop_name,
      status: u.is_vendor, // 1 pendiente, 2 aprobado
      balance: u.current_balance,
    }));
  }

  /** Aprobar (2), regresar a pendiente (1) o revocar (0). */
  @Patch('vendors/:id')
  async updateVendor(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: number }) {
    const status = Number(body?.status);
    if (![0, 1, 2].includes(status)) throw new BadRequestException('status debe ser 0, 1 o 2');
    await prisma.users.update({ where: { id }, data: { is_vendor: status, updated_at: new Date() } });
    return { ok: true };
  }

  // ---- Retiros ----

  @Get('withdraws')
  async withdraws() {
    const rows = await prisma.withdraws.findMany({ orderBy: { id: 'desc' }, take: 100 });
    const users = await prisma.users.findMany({
      where: { id: { in: rows.map((w) => w.user_id ?? 0) } },
      select: { id: true, name: true, shop_name: true },
    });
    const names = new Map(users.map((u) => [u.id, u.shop_name ?? u.name]));
    return rows.map((w) => ({
      id: w.id,
      vendor: w.user_id ? names.get(w.user_id) ?? `#${w.user_id}` : null,
      amount: w.amount ?? 0,
      method: w.method,
      reference: w.reference,
      status: w.status,
      createdAt: w.created_at ? w.created_at.toISOString() : null,
    }));
  }

  /** completed = pagado; rejected = reembolsa el saldo descontado al solicitar. */
  @Patch('withdraws/:id')
  async updateWithdraw(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: string }) {
    const status = String(body?.status ?? '');
    if (!['completed', 'rejected'].includes(status)) {
      throw new BadRequestException('status debe ser completed o rejected');
    }
    const w = await prisma.withdraws.findUnique({ where: { id } });
    if (!w) throw new NotFoundException();
    if (w.status !== 'pending') throw new BadRequestException('El retiro ya fue procesado');

    if (status === 'rejected' && w.user_id && w.amount) {
      await prisma.$transaction([
        prisma.withdraws.update({ where: { id }, data: { status: 'rejected', updated_at: new Date() } }),
        prisma.users.update({
          where: { id: w.user_id },
          data: { current_balance: { increment: Math.round(w.amount) } },
        }),
      ]);
    } else {
      await prisma.withdraws.update({ where: { id }, data: { status: 'completed', updated_at: new Date() } });
    }
    return { ok: true };
  }
}
