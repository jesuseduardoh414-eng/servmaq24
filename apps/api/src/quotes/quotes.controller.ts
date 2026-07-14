import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { verifySupabaseToken } from '../common/supabase-auth';
import { z } from 'zod';
import { QuotesService } from './quotes.service';
import { JwtGuard, type AuthedRequest } from '../auth/jwt.guard';

const quoteSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    qty: z.number().int().min(1).max(999),
    days: z.number().int().min(1).max(365).optional(),
  })).min(1),
  customer: z.object({
    name: z.string().min(2).max(190),
    email: z.string().email().max(190),
    phone: z.string().min(7).max(30),
    company: z.string().max(190).optional(),
    region: z.string().max(190).optional(),
    industry: z.string().max(190).optional(),
  }),
  acquisitionOption: z.string().max(100).optional(),
  address: z.string().max(400).optional(),
  comments: z.string().max(2000).optional(),
});

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  /** Público: los invitados también pueden cotizar. Si viene Bearer, se liga al usuario. */
  @Post()
  async create(@Body() body: unknown, @Headers('authorization') auth?: string) {
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    }

    let userId: number | null = null;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      try {
        const claims = await verifySupabaseToken(token);
        userId = claims.app_metadata?.app_user_id ?? null;
      } catch {
        userId = null; // token inválido → sigue como invitado
      }
    }

    return this.quotes.create(parsed.data, userId);
  }

  @Get('mine')
  @UseGuards(JwtGuard)
  mine(@Req() req: AuthedRequest) {
    return this.quotes.listByUser(req.userId);
  }

  @Get(':quoteNumber')
  @UseGuards(JwtGuard)
  byNumber(@Req() req: AuthedRequest, @Param('quoteNumber') quoteNumber: string) {
    return this.quotes.byNumber(req.userId, quoteNumber);
  }
}
