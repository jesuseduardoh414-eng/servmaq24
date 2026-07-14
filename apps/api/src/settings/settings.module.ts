import { Controller, Get, Module } from '@nestjs/common';
import { prisma } from '@maqserv/db';
import type { SiteSettings } from '@maqserv/types';
import { imageUrl } from '../catalog/images';

@Controller('settings')
class SettingsController {
  /** Datos de contacto + branding del sitio (de generalsettings legacy). */
  @Get('site')
  async site(): Promise<SiteSettings> {
    const gs = await prisma.generalsettings.findFirst({
      select: { email: true, phone: true, logo: true },
    });
    return {
      email: gs?.email ?? null,
      phone: gs?.phone ?? null,
      logo: imageUrl(gs?.logo ?? null),
    };
  }
}

@Module({ controllers: [SettingsController] })
export class SettingsModule {}
