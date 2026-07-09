import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { FreightService } from './freight.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, FreightService],
})
export class QuotesModule {}
