import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { prisma } from '@servmaq/db';
import type { ProductComment, ProductCommentsSummary } from '@servmaq/types';
import { JwtGuard, type AuthedRequest } from '../auth/jwt.guard';

const commentSchema = z.object({
  text: z.string().min(3).max(2000),
  rating: z.number().int().min(1).max(5),
});

/** Comentarios con calificación de producto (tabla legacy `comments`). */
@Controller('catalog/products/:id/comments')
export class CommentsController {
  @Get()
  async list(@Param('id', ParseIntPipe) productId: number): Promise<ProductCommentsSummary> {
    const rows = await prisma.comments.findMany({
      where: { product_id: productId },
      orderBy: { id: 'desc' },
      take: 50,
    });
    const users = await prisma.users.findMany({
      where: { id: { in: rows.map((r) => r.user_id) } },
      select: { id: true, name: true },
    });
    const names = new Map(users.map((u) => [u.id, u.name]));

    const items: ProductComment[] = rows.map((r) => ({
      id: r.id,
      author: names.get(r.user_id) ?? 'Cliente',
      rating: Math.max(1, Math.min(5, r.rating ?? 5)),
      text: r.text,
      date: r.created_at ? r.created_at.toISOString() : null,
    }));
    const count = items.length;
    const average = count === 0 ? 0 : Math.round((items.reduce((s, i) => s + i.rating, 0) / count) * 10) / 10;
    return { items, average, count };
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: unknown,
  ): Promise<ProductComment> {
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    }
    const product = await prisma.products.findFirst({ where: { id: productId, status: 1 } });
    if (!product) throw new BadRequestException('Producto no disponible');

    const c = await prisma.comments.create({
      data: {
        user_id: req.userId,
        product_id: productId,
        text: parsed.data.text,
        rating: parsed.data.rating,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    const user = await prisma.users.findUnique({ where: { id: req.userId }, select: { name: true } });
    return {
      id: c.id,
      author: user?.name ?? 'Cliente',
      rating: parsed.data.rating,
      text: c.text,
      date: c.created_at.toISOString(),
    };
  }
}
