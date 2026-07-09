/**
 * DTOs del catálogo (Fase 1). La API traduce el esquema legacy
 * (cprice, cat_name, fotos como filename…) a estas formas limpias;
 * el frontend NUNCA ve nombres de columnas del Laravel viejo.
 */

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  /** Precio de venta actual (legacy cprice). Null si no aplica. */
  price: number | null;
  /** Precio anterior/tachado (legacy pprice). */
  oldPrice: number | null;
  image: string | null;
  isRental: boolean;
  featured: boolean;
  inStock: boolean;
  categorySlug: string | null;
}

export interface MedicalInfo {
  lote: string | null;
  caducidad: string | null; // ISO date
  fichaTecnica: string | null; // URL del PDF
  certificacionDc3: string | null;
}

export interface ProductDetail extends ProductCard {
  description: string;
  gallery: string[];
  medical: MedicalInfo;
  rentalFreight: number | null;
  youtube: string | null;
  tags: string[];
  categoryName: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  views: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface SiteSettings {
  email: string | null;
  phone: string | null;
}
