import { Controller, Get, Module } from '@nestjs/common';
import { prisma } from '@servmaq/db';
import type { SiteSettings } from '@servmaq/types';

@Controller('settings')
class SettingsController {
  /** Datos de contacto del sitio (de generalsettings legacy). */
  @Get('site')
  async site(): Promise<SiteSettings> {
    const gs = await prisma.generalsettings.findFirst({
      select: { email: true, phone: true },
    });
    return { email: gs?.email ?? null, phone: gs?.phone ?? null };
  }
}

@Module({ controllers: [SettingsController] })
export class SettingsModule {}
