import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ThemeModule } from './theme/theme.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [AuthModule, ThemeModule, CatalogModule, SettingsModule, ContentModule, OrdersModule],
  controllers: [HealthController],
})
export class AppModule {}
