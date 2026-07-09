import { Module } from '@nestjs/common';
import { AdminAuthController, AdminGuard } from './admin-auth';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminOpsController } from './admin-ops.controller';
import { AdminThemesController } from './admin-themes.controller';

@Module({
  controllers: [AdminAuthController, AdminCatalogController, AdminOpsController, AdminThemesController],
  providers: [AdminGuard],
})
export class AdminModule {}
