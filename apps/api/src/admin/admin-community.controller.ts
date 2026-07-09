import {
  BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Query, UseGuards,
} from '@nestjs/common';
import { prisma } from '@servmaq/db';
import { AdminGuard } from './admin-auth';

/** Comunidad: usuarios, reseñas del sitio y comentarios de producto. */
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminCommunityController {
  // ---- Usuarios ----

  @Get('users')
  async users(@Query('page') page?: string, @Query('search') search?: string) {
    const p = Math.max(1, Number(page ?? 1) || 1);
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }
    const [total, rows] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (p - 1) * 20,
        take: 20,
        select: { id: true, name: true, email: true, phone: true, city: true, is_vendor: true, created_at: true },
      }),
    ]);
    // Conteo de órdenes por usuario (solo los de la página)
    const counts = await prisma.orders.groupBy({
      by: ['user_id'],
      where: { user_id: { in: rows.map((u) => u.id) } },
      _count: { _all: true },
    });
    const orderMap = new Map(counts.map((c) => [c.user_id, c._count._all]));
    return {
      total, page: p, pages: Math.max(1, Math.ceil(total / 20)),
      items: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        city: u.city,
        isVendor: u.is_vendor === 2,
        orders: orderMap.get(u.id) ?? 0,
        createdAt: u.created_at ? u.created_at.toISOString() : null,
      })),
    };
  }

  // ---- Reseñas del sitio (status 0 = pendiente de aprobación) ----

  @Get('site-reviews')
  async siteReviews() {
    const rows = await prisma.site_reviews.findMany({ orderBy: { id: 'desc' }, take: 100 });
    const users = await prisma.users.findMany({
      where: { id: { in: rows.map((r) => r.user_id) } },
      select: { id: true, name: true },
    });
    const names = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => ({
      id: Number(r.id),
      author: names.get(r.user_id) ?? `#${r.user_id}`,
      rating: r.rating,
      review: r.review,
      status: r.status, // 0 pendiente, 1 aprobada
      createdAt: r.created_at ? r.created_at.toISOString() : null,
    }));
  }

  @Patch('site-reviews/:id')
  async updateSiteReview(@Param('id', ParseIntPipe) id: number, @Body() body: { status?: number }) {
    const status = Number(body?.status);
    if (![0, 1].includes(status)) throw new BadRequestException('status debe ser 0 o 1');
    await prisma.site_reviews.update({ where: { id }, data: { status, updated_at: new Date() } });
    return { ok: true };
  }

  @Delete('site-reviews/:id')
  async deleteSiteReview(@Param('id', ParseIntPipe) id: number) {
    await prisma.site_reviews.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Suscriptores del newsletter ----

  @Get('subscribers')
  async subscribers() {
    return prisma.subscribers.findMany({ orderBy: { id: 'desc' } });
  }

  @Delete('subscribers/:id')
  async deleteSubscriber(@Param('id', ParseIntPipe) id: number) {
    await prisma.subscribers.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Comentarios de producto ----

  @Get('comments')
  async comments() {
    const rows = await prisma.comments.findMany({ orderBy: { id: 'desc' }, take: 100 });
    const [users, products] = await Promise.all([
      prisma.users.findMany({
        where: { id: { in: rows.map((r) => r.user_id) } },
        select: { id: true, name: true },
      }),
      prisma.products.findMany({
        where: { id: { in: rows.map((r) => r.product_id) } },
        select: { id: true, name: true },
      }),
    ]);
    const names = new Map(users.map((u) => [u.id, u.name]));
    const prods = new Map(products.map((p) => [p.id, p.name]));
    return rows.map((c) => ({
      id: c.id,
      author: names.get(c.user_id) ?? `#${c.user_id}`,
      product: prods.get(c.product_id) ?? `#${c.product_id}`,
      rating: c.rating ?? 5,
      text: c.text,
      createdAt: c.created_at ? c.created_at.toISOString() : null,
    }));
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    await prisma.comments.delete({ where: { id } });
    return { ok: true };
  }
}
