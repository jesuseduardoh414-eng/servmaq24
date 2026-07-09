import {
  BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param,
  ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { z } from 'zod';
import { prisma } from '@servmaq/db';
import { productSlug, slugify } from '@servmaq/config';
import { AdminGuard } from './admin-auth';
import { imageUrl } from '../catalog/images';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });
const photoStorage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').slice(-60);
    cb(null, `${Date.now()}-${safe}`);
  },
});
const IMAGE_TYPES = /^image\/(png|jpe?g|webp|avif)$/;

const productSchema = z.object({
  name: z.string().min(2).max(250),
  categoryId: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
  oldPrice: z.coerce.number().min(0).optional(),
  description: z.string().min(1).max(20000),
  stock: z.coerce.number().int().min(0).optional(),
  brand: z.string().max(190).optional(),
  isRental: z.coerce.boolean().optional(),
  rentalFreight: z.coerce.number().min(0).optional(),
  featured: z.coerce.boolean().optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
  lote: z.string().max(190).optional(),
  caducidad: z.string().optional(), // ISO date
});

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  status: z.coerce.number().int().min(0).max(1).optional(),
});

/** Gestión de catálogo (productos + categorías) — solo administradores. */
@Controller('admin/catalog')
@UseGuards(AdminGuard)
export class AdminCatalogController {
  // ---- Productos ----

  @Get('products')
  async products(@Query('page') page?: string, @Query('search') search?: string) {
    const p = Math.max(1, Number(page ?? 1) || 1);
    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search };
    const [total, rows] = await Promise.all([
      prisma.products.count({ where }),
      prisma.products.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (p - 1) * 20,
        take: 20,
        select: {
          id: true, name: true, cprice: true, stock: true, status: true,
          featured: true, photo: true, is_rental: true, category_id: true, Marca: true,
        },
      }),
    ]);
    const cats = await prisma.categories.findMany({ select: { id: true, cat_name: true } });
    const catMap = new Map(cats.map((c) => [c.id, c.cat_name]));
    return {
      total,
      page: p,
      pages: Math.max(1, Math.ceil(total / 20)),
      items: rows.map((r) => ({
        id: r.id,
        slug: productSlug(r.name, r.id),
        name: r.name,
        brand: r.Marca,
        price: r.cprice,
        stock: r.stock,
        status: r.status,
        featured: r.featured === 1,
        isRental: r.is_rental,
        image: imageUrl(r.photo),
        categoryName: catMap.get(r.category_id) ?? null,
      })),
    };
  }

  @Post('products')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 8 * 1024 * 1024 } }))
  async createProduct(@Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    if (photo && !IMAGE_TYPES.test(photo.mimetype)) throw new BadRequestException('Foto inválida');
    const d = parsed.data;
    const created = await prisma.products.create({
      data: {
        user_id: 0, // producto de la casa
        category_id: d.categoryId,
        name: d.name,
        description: d.description,
        cprice: d.price,
        pprice: d.oldPrice ?? null,
        stock: d.stock ?? null,
        Marca: d.brand ?? null,
        is_rental: d.isRental ?? false,
        rental_freight: d.rentalFreight ?? null,
        featured: d.featured ? 1 : 0,
        status: d.status ?? 1,
        lote: d.lote ?? null,
        caducidad: d.caducidad ? new Date(d.caducidad) : null,
        photo: photo ? `uploads/${photo.filename}` : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return { id: created.id };
  }

  @Patch('products/:id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 8 * 1024 * 1024 } }))
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const exists = await prisma.products.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    if (photo && !IMAGE_TYPES.test(photo.mimetype)) throw new BadRequestException('Foto inválida');
    const d = parsed.data;
    await prisma.products.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.categoryId !== undefined ? { category_id: d.categoryId } : {}),
        ...(d.price !== undefined ? { cprice: d.price } : {}),
        ...(d.oldPrice !== undefined ? { pprice: d.oldPrice } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.stock !== undefined ? { stock: d.stock } : {}),
        ...(d.brand !== undefined ? { Marca: d.brand } : {}),
        ...(d.isRental !== undefined ? { is_rental: d.isRental } : {}),
        ...(d.rentalFreight !== undefined ? { rental_freight: d.rentalFreight } : {}),
        ...(d.featured !== undefined ? { featured: d.featured ? 1 : 0 } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.lote !== undefined ? { lote: d.lote } : {}),
        ...(d.caducidad !== undefined ? { caducidad: d.caducidad ? new Date(d.caducidad) : null } : {}),
        ...(photo ? { photo: `uploads/${photo.filename}` } : {}),
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    // Baja lógica: conserva integridad de órdenes históricas
    await prisma.products.update({ where: { id }, data: { status: 0, updated_at: new Date() } });
    return { ok: true };
  }

  // ---- Categorías ----

  @Get('categories')
  async categories() {
    const [cats, counts] = await Promise.all([
      prisma.categories.findMany({ orderBy: { cat_name: 'asc' } }),
      prisma.products.groupBy({ by: ['category_id'], _count: { _all: true } }),
    ]);
    const countMap = new Map(counts.map((c) => [c.category_id, c._count._all]));
    return cats.map((c) => ({
      id: c.id,
      name: c.cat_name,
      slug: c.cat_slug,
      status: c.status,
      image: imageUrl(c.photo),
      productCount: countMap.get(c.id) ?? 0,
    }));
  }

  @Post('categories')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async createCategory(@Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    if (photo && !IMAGE_TYPES.test(photo.mimetype)) throw new BadRequestException('Foto inválida');
    const slug = slugify(parsed.data.name);
    const dup = await prisma.categories.findUnique({ where: { cat_slug: slug } });
    if (dup) throw new BadRequestException('Ya existe una categoría con ese nombre');
    const c = await prisma.categories.create({
      data: {
        cat_name: parsed.data.name,
        cat_slug: slug,
        status: parsed.data.status ?? 1,
        photo: photo ? `uploads/${photo.filename}` : null,
      },
    });
    return { id: c.id, slug: c.cat_slug };
  }

  @Patch('categories/:id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    await prisma.categories.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { cat_name: parsed.data.name } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(photo ? { photo: `uploads/${photo.filename}` } : {}),
      },
    });
    return { ok: true };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    const inUse = await prisma.products.count({ where: { category_id: id } });
    if (inUse > 0) throw new BadRequestException(`La categoría tiene ${inUse} producto(s); muévelos primero`);
    await prisma.categories.delete({ where: { id } });
    return { ok: true };
  }
}
