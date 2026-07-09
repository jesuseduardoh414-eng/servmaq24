import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ThemeModule } from './theme/theme.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [ThemeModule, CatalogModule, SettingsModule],
  controllers: [HealthController],
})
export class AppModule {}
