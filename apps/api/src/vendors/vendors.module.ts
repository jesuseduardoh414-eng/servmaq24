import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorPanelController } from './vendor-panel.controller';
import { ProductsService } from '../catalog/products.service';

@Module({
  controllers: [VendorsController, VendorPanelController],
  providers: [ProductsService],
})
export class VendorsModule {}
