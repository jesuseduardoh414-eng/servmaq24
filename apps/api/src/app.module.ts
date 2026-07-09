import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ThemeModule } from './theme/theme.module';
import { CatalogModule } from './catalog/catalog.module';
import { SettingsModule } from './settings/settings.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { AccountModule } from './account/account.module';
import { VendorsModule } from './vendors/vendors.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AuthModule, ThemeModule, CatalogModule, SettingsModule, ContentModule, OrdersModule, QuotesModule, AccountModule, VendorsModule, AdminModule],
  controllers: [HealthController],
})
export class AppModule {}
