import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@servmaq/db';
import { productSlug } from '@servmaq/config';
import type { Paginated, ProductCard, ProductDetail } from '@servmaq/types';
import { imageUrl } from './images';

const PAGE_SIZE = 12;

type ProductRow = {
  id: number;
  name: string;
  Marca: string | null;
  cprice: number;
  pprice: number | null;
  photo: string | null;
  is_rental: boolean;
  featured: number;
  stock: number | null;
  category_id: number;
};

@Injectable()
export class ProductsService {
  private toCard(p: ProductRow, catSlugs: Map<number, string>): ProductCard {
    return {
      id: p.id,
      slug: productSlug(p.name, p.id),
      name: p.name,
      brand: p.Marca,
      price: p.cprice > 0 ? p.cprice : null,
      oldPrice: p.pprice && p.pprice > 0 ? p.pprice : null,
      image: imageUrl(p.photo),
      isRental: p.is_rental,
      featured: p.featured === 1,
      inStock: p.stock === null || p.stock > 0,
      categorySlug: catSlugs.get(p.category_id) ?? null,
    };
  }

  private async categorySlugMap(): Promise<Map<number, string>> {
    const cats = await prisma.categories.findMany({ select: { id: true, cat_slug: true } });
    return new Map(cats.map((c) => [c.id, c.cat_slug]));
  }

  async list(opts: {
    page?: number;
    search?: string;
    category?: string; // cat_slug
    featured?: boolean;
    vendorId?: number; // tienda de un vendedor (products.user_id)
  }): Promise<Paginated<ProductCard>> {
    const page = Math.max(1, opts.page ?? 1);

    // Solo productos publicados (status=1, convención del Laravel viejo)
    const where: Record<string, unknown> = { status: 1 };
    if (opts.search) where.name = { contains: opts.search };
    if (opts.featured) where.featured = 1;
    if (opts.vendorId) where.user_id = opts.vendorId;
    if (opts.category) {
      const cat = await prisma.categories.findUnique({ where: { cat_slug: opts.category } });
      where.category_id = cat ? cat.id : -1; // categoría inexistente → 0 resultados
    }

    const [total, rows] = await Promise.all([
      prisma.products.count({ where }),
      prisma.products.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, name: true, Marca: true, cprice: true, pprice: true,
          photo: true, is_rental: true, featured: true, stock: true, category_id: true,
        },
      }),
    ]);

    const catSlugs = await this.categorySlugMap();
    return {
      items: rows.map((p) => this.toCard(p, catSlugs)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

  async byId(id: number): Promise<ProductDetail> {
    const p = await prisma.products.findFirst({ where: { id, status: 1 } });
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);

    const [gallery, cat] = await Promise.all([
      prisma.galleries.findMany({ where: { product_id: id }, select: { photo: true } }),
      prisma.categories.findUnique({ where: { id: p.category_id } }),
    ]);

    const catSlugs = new Map(cat ? [[cat.id, cat.cat_slug] as const] : []);
    return {
      ...this.toCard(p, catSlugs),
      description: p.description,
      gallery: gallery.map((g) => imageUrl(g.photo)).filter((u): u is string => u !== null),
      medical: {
        lote: p.lote,
        caducidad: p.caducidad ? p.caducidad.toISOString().slice(0, 10) : null,
        fichaTecnica: imageUrl(p.ficha_tecnica),
        certificacionDc3: imageUrl(p.certificacion_dc3),
      },
      rentalFreight: p.rental_freight ? Number(p.rental_freight) : null,
      youtube: p.youtube,
      tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      categoryName: cat?.cat_name ?? null,
      metaTitle: p.is_meta ? p.meta_tag : null,
      metaDescription: p.is_meta ? p.meta_description : null,
      views: p.views,
    };
  }
}
