import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('hero')
  hero() {
    return this.content.hero();
  }

  @Get('sectors')
  sectors() {
    return this.content.sectors();
  }

  @Get('sectors/:id')
  sectorById(@Param('id', ParseIntPipe) id: number) {
    return this.content.sectorById(id);
  }

  @Get('why-choose-us')
  whyChooseUs() {
    return this.content.whyChooseUs();
  }

  @Get('services')
  services() {
    return this.content.services();
  }

  @Get('banners')
  banners() {
    return this.content.banners();
  }

  @Get('blogs')
  blogs(@Query('limit') limit?: string) {
    return this.content.blogs(limit ? Number(limit) : undefined);
  }

  @Get('blogs/:id')
  blogById(@Param('id', ParseIntPipe) id: number) {
    return this.content.blogById(id);
  }

  @Get('faqs')
  faqs() {
    return this.content.faqs();
  }

  @Get('reviews')
  reviews(@Query('limit') limit?: string) {
    return this.content.reviews(limit ? Number(limit) : undefined);
  }
}
