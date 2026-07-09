import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TrackController } from './track.controller';
import { PaymentsController } from '../payments/payments.controller';
import { PaymentsService } from '../payments/payments.service';

/** Orders + Payments juntos: el checkout crea la orden y arranca el pago. */
@Module({
  controllers: [OrdersController, TrackController, PaymentsController],
  providers: [OrdersService, PaymentsService],
})
export class OrdersModule {}
