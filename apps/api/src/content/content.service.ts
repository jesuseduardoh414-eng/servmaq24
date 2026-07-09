import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@servmaq/db';
import { productSlug } from '@servmaq/config';
import type {
  BannerSet,
  BlogCard,
  BlogDetail,
  FaqItem,
  HomeHero,
  ServiceItem,
  SiteReview,
  StrategicSector,
  StrategicSectorDetail,
  WhyChooseUsItem,
} from '@servmaq/types';
import { imageUrl } from '../catalog/images';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

@Injectable()
export class ContentService {
  async hero(): Promise<HomeHero | null> {
    const h = await prisma.hero_sections.findFirst({ orderBy: { id: 'desc' } });
    if (!h) return null;
    return {
      badge: h.badge,
      title: h.title,
      subtitle: h.subtitle,
      feature1: h.feature1,
      feature2: h.feature2,
      image: imageUrl(h.image),
    };
  }

  async sectors(): Promise<StrategicSector[]> {
    const rows = await prisma.strategic_sectors.findMany({
      where: { status: 1 },
      orderBy: { id: 'asc' },
    });
    return rows.map((s) => ({
      id: Number(s.id), // BigInt legacy → number
      slug: productSlug(s.title, Number(s.id)),
      title: s.title,
      description: s.description ? stripHtml(s.description).slice(0, 200) : null,
      image: imageUrl(s.image),
    }));
  }

  async sectorById(id: number): Promise<StrategicSectorDetail> {
    const s = await prisma.strategic_sectors.findFirst({ where: { id, status: 1 } });
    if (!s) throw new NotFoundException(`Sector ${id} no encontrado`);
    let serviciosLista: string[] = [];
    if (s.servicios_lista) {
      // legacy: JSON array o texto separado por saltos de línea
      try {
        const parsed = JSON.parse(s.servicios_lista);
        if (Array.isArray(parsed)) serviciosLista = parsed.map(String);
      } catch {
        serviciosLista = s.servicios_lista.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      }
    }
    return {
      id: Number(s.id),
      slug: productSlug(s.title, Number(s.id)),
      title: s.title,
      description: s.description,
      image: imageUrl(s.image),
      trayectoria: s.trayectoria,
      esencia: s.esencia,
      servicios: s.servicios,
      excelencia: s.excelencia,
      serviciosLista,
    };
  }

  async whyChooseUs(): Promise<WhyChooseUsItem[]> {
    const rows = await prisma.why_choose_us.findMany({
      where: { status: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((w) => ({
      id: Number(w.id),
      title: w.title,
      description: stripHtml(w.description),
      icon: w.icon,
      photo: imageUrl(w.photo),
    }));
  }

  async services(): Promise<ServiceItem[]> {
    const rows = await prisma.services.findMany({ orderBy: { id: 'asc' } });
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      text: stripHtml(s.text),
      photo: imageUrl(s.photo),
    }));
  }

  /** La tabla legacy es UNA fila con slots top1..top5 / bottom1..bottom2 (+ *l = link). */
  async banners(): Promise<BannerSet> {
    const b = await prisma.banners.findFirst();
    if (!b) return { top: [], bottom: [] };
    const slot = (img: string | null, link: string | null) =>
      img ? [{ image: imageUrl(img) as string, link: link || null }] : [];
    return {
      top: [
        ...slot(b.top1, b.top1l), ...slot(b.top2, b.top2l), ...slot(b.top3, b.top3l),
        ...slot(b.top4, b.top4l), ...slot(b.top5, b.top5l),
      ],
      bottom: [...slot(b.bottom1, b.bottom1l), ...slot(b.bottom2, b.bottom2l)],
    };
  }

  private toBlogCard(b: { id: number; title: string; details: string; photo: string | null; created_at: Date | null }): BlogCard {
    return {
      id: b.id,
      slug: productSlug(b.title, b.id),
      title: b.title,
      excerpt: stripHtml(b.details).slice(0, 160),
      image: imageUrl(b.photo),
      date: b.created_at ? b.created_at.toISOString() : null,
    };
  }

  async blogs(limit = 3): Promise<BlogCard[]> {
    const rows = await prisma.blogs.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' },
      take: Math.min(limit, 12),
    });
    return rows.map((b) => this.toBlogCard(b));
  }

  async blogById(id: number): Promise<BlogDetail> {
    const b = await prisma.blogs.findFirst({ where: { id, status: 1 } });
    if (!b) throw new NotFoundException(`Blog ${id} no encontrado`);
    return {
      ...this.toBlogCard(b),
      contentHtml: b.details,
      metaTitle: b.meta_tag,
      metaDescription: b.meta_description,
    };
  }

  async faqs(): Promise<FaqItem[]> {
    const rows = await prisma.faqs.findMany({ orderBy: { id: 'asc' } });
    return rows.map((f) => ({ id: f.id, question: f.title, answer: f.text }));
  }

  async reviews(limit = 6): Promise<SiteReview[]> {
    const rows = await prisma.site_reviews.findMany({
      where: { status: 1 },
      orderBy: { id: 'desc' },
      take: Math.min(limit, 20),
    });
    const users = await prisma.users.findMany({
      where: { id: { in: rows.map((r) => r.user_id) } },
      select: { id: true, name: true },
    });
    const names = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => ({
      id: Number(r.id),
      rating: Math.max(1, Math.min(5, r.rating)),
      review: r.review,
      author: names.get(r.user_id) ?? 'Cliente',
      date: r.created_at ? r.created_at.toISOString() : null,
    }));
  }
}
