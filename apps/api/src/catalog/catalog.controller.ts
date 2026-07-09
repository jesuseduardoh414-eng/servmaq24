import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
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
    @Query('featured') featured?: string,
  ) {
    return this.products.list({
      page: page ? Number(page) : undefined,
      search: search || undefined,
      category: category || undefined,
      featured: featured === '1' || featured === 'true',
    });
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
