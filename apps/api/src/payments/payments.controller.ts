import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('methods')
  methods() {
    return this.payments.methods();
  }

  /** MercadoPago manda GET o POST según el tipo de notificación. */
  @Post('mercadopago/webhook')
  webhook(@Query() query: Record<string, unknown>, @Body() body: unknown) {
    return this.payments.handleMercadoPagoWebhook(query, body);
  }

  @Get('mercadopago/webhook')
  webhookGet(@Query() query: Record<string, unknown>) {
    return this.payments.handleMercadoPagoWebhook(query, null);
  }
}
