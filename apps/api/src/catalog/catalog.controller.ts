import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { prisma } from '@maqserv/db';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly products: ProductsService,
    private readonly categories: CategoriesService,
  ) {}

  @Get('products')
  listProducts(
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('featured') featured?: string,
  ) {
    return this.products.list({
      page: page ? Number(page) : undefined,
      search: search || undefined,
      category: category || undefined,
      subcategory: subcategory || undefined,
      featured: featured === '1' || featured === 'true',
    });
  }

  /** Subcategorías activas de una categoría (para los filtros del catálogo). */
  @Get('categories/:slug/subcategories')
  async subcategories(@Param('slug') slug: string) {
    const cat = await prisma.categories.findUnique({ where: { cat_slug: slug } });
    if (!cat) return [];
    const subs = await prisma.subcategories.findMany({
      where: { category_id: cat.id, status: 1 },
      orderBy: { sub_name: 'asc' },
    });
    return subs.map((s) => ({ id: s.id, name: s.sub_name, slug: s.sub_slug }));
  }

  @Get('products/:id')
  productById(@Param('id', ParseIntPipe) id: number) {
    return this.products.byId(id);
  }

  @Get('categories')
  listCategories() {
    return this.categories.list();
  }
}
