import {
  BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param,
  ParseIntPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { z } from 'zod';
import { prisma } from '@servmaq/db';
import { productSlug } from '@servmaq/config';
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
const photoOk = (f?: Express.Multer.File) => {
  if (f && !IMAGE_TYPES.test(f.mimetype)) throw new BadRequestException('Imagen inválida');
};

const blogSchema = z.object({
  title: z.string().min(2).max(250),
  details: z.string().min(4),
  source: z.string().max(250).optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
  metaTag: z.string().max(500).optional(),
  metaDescription: z.string().max(1000).optional(),
});

const faqSchema = z.object({
  title: z.string().min(2).max(250),
  text: z.string().min(2),
});

const heroSchema = z.object({
  badge: z.string().max(190).optional(),
  title: z.string().max(250).optional(),
  subtitle: z.string().max(2000).optional(),
  feature1: z.string().max(190).optional(),
  feature2: z.string().max(190).optional(),
});

const itemSchema = z.object({
  title: z.string().min(2).max(190),
  text: z.string().min(2),
});

const settingsSchema = z.object({
  email: z.string().email().max(190).optional(),
  phone: z.string().max(50).optional(),
  street: z.string().max(400).optional(),
});

/** CMS del sitio: blog, FAQ, hero, servicios, why-choose-us y ajustes. */
@Controller('admin/cms')
@UseGuards(AdminGuard)
export class AdminCmsController {
  // ---- Blog ----

  @Get('blogs')
  async blogs() {
    const rows = await prisma.blogs.findMany({ orderBy: { id: 'desc' } });
    return rows.map((b) => ({
      id: b.id,
      slug: productSlug(b.title, b.id),
      title: b.title,
      status: b.status,
      image: imageUrl(b.photo),
      createdAt: b.created_at ? b.created_at.toISOString() : null,
    }));
  }

  @Get('blogs/:id')
  async blog(@Param('id', ParseIntPipe) id: number) {
    const b = await prisma.blogs.findUnique({ where: { id } });
    if (!b) throw new NotFoundException();
    return {
      id: b.id, title: b.title, details: b.details, source: b.source,
      status: b.status, metaTag: b.meta_tag, metaDescription: b.meta_description,
      image: imageUrl(b.photo),
    };
  }

  @Post('blogs')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 6 * 1024 * 1024 } }))
  async createBlog(@Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = blogSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    photoOk(photo);
    const b = await prisma.blogs.create({
      data: {
        title: parsed.data.title,
        details: parsed.data.details,
        source: parsed.data.source ?? '',
        status: parsed.data.status ?? 1,
        meta_tag: parsed.data.metaTag ?? null,
        meta_description: parsed.data.metaDescription ?? null,
        photo: photo ? `uploads/${photo.filename}` : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return { id: b.id };
  }

  @Patch('blogs/:id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 6 * 1024 * 1024 } }))
  async updateBlog(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = blogSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(photo);
    const d = parsed.data;
    await prisma.blogs.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.details !== undefined ? { details: d.details } : {}),
        ...(d.source !== undefined ? { source: d.source } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.metaTag !== undefined ? { meta_tag: d.metaTag } : {}),
        ...(d.metaDescription !== undefined ? { meta_description: d.metaDescription } : {}),
        ...(photo ? { photo: `uploads/${photo.filename}` } : {}),
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  @Delete('blogs/:id')
  async deleteBlog(@Param('id', ParseIntPipe) id: number) {
    await prisma.blogs.delete({ where: { id } });
    return { ok: true };
  }

  // ---- FAQ ----

  @Get('faqs')
  async faqs() {
    return prisma.faqs.findMany({ orderBy: { id: 'asc' } });
  }

  @Post('faqs')
  async createFaq(@Body() body: unknown) {
    const parsed = faqSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const f = await prisma.faqs.create({ data: parsed.data });
    return { id: f.id };
  }

  @Patch('faqs/:id')
  async updateFaq(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const parsed = faqSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    await prisma.faqs.update({ where: { id }, data: parsed.data });
    return { ok: true };
  }

  @Delete('faqs/:id')
  async deleteFaq(@Param('id', ParseIntPipe) id: number) {
    await prisma.faqs.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Hero de la home ----

  @Get('hero')
  async hero() {
    const h = await prisma.hero_sections.findFirst({ orderBy: { id: 'desc' } });
    return h
      ? { id: h.id, badge: h.badge, title: h.title, subtitle: h.subtitle, feature1: h.feature1, feature2: h.feature2, image: imageUrl(h.image) }
      : null;
  }

  @Patch('hero')
  @UseInterceptors(FileInterceptor('image', { storage: photoStorage, limits: { fileSize: 6 * 1024 * 1024 } }))
  async updateHero(@Body() body: unknown, @UploadedFile() image?: Express.Multer.File) {
    const parsed = heroSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(image);
    const existing = await prisma.hero_sections.findFirst({ orderBy: { id: 'desc' } });
    const data = {
      ...parsed.data,
      ...(image ? { image: `uploads/${image.filename}` } : {}),
      updated_at: new Date(),
    };
    if (existing) {
      await prisma.hero_sections.update({ where: { id: existing.id }, data });
    } else {
      await prisma.hero_sections.create({ data: { ...data, created_at: new Date() } });
    }
    return { ok: true };
  }

  // ---- Servicios ----

  @Get('services')
  async services() {
    const rows = await prisma.services.findMany({ orderBy: { id: 'asc' } });
    return rows.map((s) => ({ id: s.id, title: s.title, text: s.text, image: imageUrl(s.photo) }));
  }

  @Post('services')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async createService(@Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(photo);
    const s = await prisma.services.create({
      data: { title: parsed.data.title, text: parsed.data.text, photo: photo ? `uploads/${photo.filename}` : '' },
    });
    return { id: s.id };
  }

  @Patch('services/:id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async updateService(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = itemSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(photo);
    await prisma.services.update({
      where: { id },
      data: { ...parsed.data, ...(photo ? { photo: `uploads/${photo.filename}` } : {}) },
    });
    return { ok: true };
  }

  @Delete('services/:id')
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    await prisma.services.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Why choose us ----

  @Get('why-choose-us')
  async whyChooseUs() {
    const rows = await prisma.why_choose_us.findMany({ orderBy: { order: 'asc' } });
    return rows.map((w) => ({
      id: Number(w.id), title: w.title, text: w.description, status: w.status, image: imageUrl(w.photo),
    }));
  }

  @Post('why-choose-us')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async createWhy(@Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(photo);
    const max = await prisma.why_choose_us.aggregate({ _max: { order: true } });
    const w = await prisma.why_choose_us.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.text,
        order: (max._max.order ?? 0) + 1,
        status: true,
        photo: photo ? `uploads/${photo.filename}` : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    return { id: Number(w.id) };
  }

  @Patch('why-choose-us/:id')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 4 * 1024 * 1024 } }))
  async updateWhy(@Param('id', ParseIntPipe) id: number, @Body() body: unknown, @UploadedFile() photo?: Express.Multer.File) {
    const parsed = itemSchema.partial().safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(photo);
    await prisma.why_choose_us.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.text !== undefined ? { description: parsed.data.text } : {}),
        ...(photo ? { photo: `uploads/${photo.filename}` } : {}),
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  @Delete('why-choose-us/:id')
  async deleteWhy(@Param('id', ParseIntPipe) id: number) {
    await prisma.why_choose_us.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Banners (tabla legacy: UNA fila con slots top1..top5 / bottom1..2) ----

  @Get('banners')
  async banners() {
    const b = await prisma.banners.findFirst();
    const SLOTS = ['top1', 'top2', 'top3', 'top4', 'top5', 'bottom1', 'bottom2'] as const;
    const row = (b ?? {}) as Record<string, string | null>;
    return SLOTS.map((slot) => ({
      slot,
      image: imageUrl(row[slot] ?? null),
      link: row[`${slot}l`] ?? null,
    }));
  }

  @Patch('banners/:slot')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, limits: { fileSize: 6 * 1024 * 1024 } }))
  async updateBanner(
    @Param('slot') slot: string,
    @Body() body: { link?: string; clear?: string },
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!/^(top[1-5]|bottom[12])$/.test(slot)) throw new BadRequestException('Slot inválido');
    photoOk(photo);
    let b = await prisma.banners.findFirst();
    if (!b) b = await prisma.banners.create({ data: {} });

    const data: Record<string, string | null> = {};
    if (photo) data[slot] = `uploads/${photo.filename}`;
    if (body?.link !== undefined) data[`${slot}l`] = String(body.link) || null;
    if (body?.clear === 'true') {
      data[slot] = null;
      data[`${slot}l`] = null;
    }
    await prisma.banners.update({ where: { id: b.id }, data });
    return { ok: true };
  }

  // ---- Sectores estratégicos ----

  @Get('sectors')
  async sectors() {
    const rows = await prisma.strategic_sectors.findMany({ orderBy: { id: 'asc' } });
    return rows.map((s) => ({
      id: Number(s.id),
      title: s.title,
      status: s.status,
      image: imageUrl(s.image),
    }));
  }

  @Get('sectors/:id')
  async sectorById(@Param('id', ParseIntPipe) id: number) {
    const s = await prisma.strategic_sectors.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    return {
      id: Number(s.id),
      title: s.title,
      description: s.description,
      trayectoria: s.trayectoria,
      esencia: s.esencia,
      servicios: s.servicios,
      excelencia: s.excelencia,
      serviciosLista: s.servicios_lista,
      status: s.status,
      image: imageUrl(s.image),
    };
  }

  @Post('sectors')
  async createSector(@Body() body: { title?: string }) {
    const title = String(body?.title ?? '').trim();
    if (title.length < 2) throw new BadRequestException('Título requerido');
    const s = await prisma.strategic_sectors.create({
      data: { title, status: 1, created_at: new Date(), updated_at: new Date() },
    });
    return { id: Number(s.id) };
  }

  @Patch('sectors/:id')
  @UseInterceptors(FileInterceptor('image', { storage: photoStorage, limits: { fileSize: 6 * 1024 * 1024 } }))
  async updateSector(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const schema = z.object({
      title: z.string().min(2).max(190).optional(),
      description: z.string().max(20000).optional(),
      trayectoria: z.string().max(20000).optional(),
      esencia: z.string().max(20000).optional(),
      servicios: z.string().max(20000).optional(),
      excelencia: z.string().max(20000).optional(),
      serviciosLista: z.string().max(5000).optional(), // una línea por servicio
      status: z.coerce.number().int().min(0).max(1).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    photoOk(image);
    const d = parsed.data;
    await prisma.strategic_sectors.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.trayectoria !== undefined ? { trayectoria: d.trayectoria } : {}),
        ...(d.esencia !== undefined ? { esencia: d.esencia } : {}),
        ...(d.servicios !== undefined ? { servicios: d.servicios } : {}),
        ...(d.excelencia !== undefined ? { excelencia: d.excelencia } : {}),
        ...(d.serviciosLista !== undefined ? { servicios_lista: d.serviciosLista } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(image ? { image: `uploads/${image.filename}` } : {}),
        updated_at: new Date(),
      },
    });
    return { ok: true };
  }

  @Delete('sectors/:id')
  async deleteSector(@Param('id', ParseIntPipe) id: number) {
    await prisma.strategic_sectors.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Quiénes somos (inf_sitio) ----

  @Get('inf-sitio')
  async infSitio() {
    const r = await prisma.inf_sitio.findFirst({ orderBy: { id: 'desc' } });
    return r
      ? { frase: r.frase, titulo: r.titulo, descripcion: r.descripcion, mision: r.mision, vision: r.vision, objetivos: r.objetivos }
      : null;
  }

  @Patch('inf-sitio')
  async updateInfSitio(@Body() body: unknown) {
    const schema = z.object({
      frase: z.string().max(250).optional(),
      titulo: z.string().max(250).optional(),
      descripcion: z.string().max(10000).optional(),
      mision: z.string().max(5000).optional(),
      vision: z.string().max(5000).optional(),
      objetivos: z.string().max(5000).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const existing = await prisma.inf_sitio.findFirst({ orderBy: { id: 'desc' } });
    if (existing) {
      await prisma.inf_sitio.update({ where: { id: existing.id }, data: { ...parsed.data, updated_at: new Date() } });
    } else {
      await prisma.inf_sitio.create({ data: { ...parsed.data, created_at: new Date(), updated_at: new Date() } });
    }
    return { ok: true };
  }

  // ---- Ajustes de contacto (generalsettings) ----

  @Get('settings')
  async settings() {
    const gs = await prisma.generalsettings.findFirst({
      select: { id: true, email: true, phone: true, street: true },
    });
    return gs ?? null;
  }

  @Patch('settings')
  async updateSettings(@Body() body: unknown) {
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');
    const gs = await prisma.generalsettings.findFirst({ select: { id: true } });
    if (!gs) throw new NotFoundException('No hay registro de generalsettings');
    await prisma.generalsettings.update({ where: { id: gs.id }, data: parsed.data });
    return { ok: true };
  }
}
