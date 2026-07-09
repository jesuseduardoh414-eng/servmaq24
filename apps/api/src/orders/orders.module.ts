import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentsController } from '../payments/payments.controller';
import { PaymentsService } from '../payments/payments.service';

/** Orders + Payments juntos: el checkout crea la orden y arranca el pago. */
@Module({
  controllers: [OrdersController, PaymentsController],
  providers: [OrdersService, PaymentsService],
})
export class OrdersModule {}
