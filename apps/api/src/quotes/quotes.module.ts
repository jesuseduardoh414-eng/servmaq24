import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { FreightModule } from '../freight/freight.module';

@Module({
  imports: [FreightModule],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
