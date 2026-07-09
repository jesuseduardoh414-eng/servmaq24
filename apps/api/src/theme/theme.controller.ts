import { Controller, Get } from '@nestjs/common';
import { ThemeService } from './theme.service';

@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  /** Config del tema activo: la consume el frontend en SSR. */
  @Get()
  getActive() {
    return this.themeService.getActive();
  }
}
