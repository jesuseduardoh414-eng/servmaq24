import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ThemeModule } from './theme/theme.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [ThemeModule, CatalogModule, SettingsModule, ContentModule],
  controllers: [HealthController],
})
export class AppModule {}
