import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { prisma } from '@maqserv/db';
import type { OrderSummary, PaymentMethod } from '@maqserv/types';
import { OrdersService } from '../orders/orders.service';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? 'http://localhost:4000';

/**
 * Pagos tras una interfaz común.
 * - transferencia: offline (gateway legacy "Deposito bancario"), sin proveedor.
 * - mercadopago: Checkout Pro (preferencia → redirect → webhook), como el
 *   legacy pero con notification_url (el viejo solo usaba back_urls).
 * Requiere MP_ACCESS_TOKEN (credenciales de SANDBOX en dev — pendiente usuario).
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(private readonly orders: OrdersService) {}

  private get mpClient(): MercadoPagoConfig | null {
    const token = process.env.MP_ACCESS_TOKEN;
    return token ? new MercadoPagoConfig({ accessToken: token }) : null;
  }

  async methods(): Promise<PaymentMethod[]> {
    // El título/instrucciones de transferencia salen del gateway legacy (editable en admin)
    const gw = await prisma.payment_gateways.findFirst({ where: { status: 1 } });
    return [
      {
        id: 'transferencia',
        title: gw?.title ?? 'Transferencia bancaria',
        instructions: gw?.text ?? null,
        available: true,
      },
      {
        id: 'mercadopago',
        title: 'MercadoPago',
        instructions: null,
        available: this.mpClient !== null,
      },
    ];
  }

  /** Crea la preferencia de Checkout Pro y devuelve la URL de redirección. */
  async createMercadoPagoRedirect(order: OrderSummary): Promise<string> {
    const client = this.mpClient;
    if (!client) {
      throw new ServiceUnavailableException(
        'MercadoPago no está configurado (falta MP_ACCESS_TOKEN)',
      );
    }

    const preference = await new Preference(client).create({
      body: {
        // Igual que el legacy: un solo item con el total
        items: [
          {
            id: order.orderNumber,
            title: 'Total de compra',
            quantity: 1,
            unit_price: order.total,
          },
        ],
        external_reference: order.orderNumber,
        back_urls: {
          success: `${SITE_URL}/pedido/${order.orderNumber}`,
          pending: `${SITE_URL}/pedido/${order.orderNumber}`,
          failure: `${SITE_URL}/checkout`,
        },
        auto_return: 'all',
        notification_url: `${API_PUBLIC_URL}/payments/mercadopago/webhook`,
      },
    });

    const url = preference.init_point ?? preference.sandbox_init_point;
    if (!url) throw new ServiceUnavailableException('MercadoPago no devolvió URL de pago');
    return url;
  }

  /**
   * Webhook de MercadoPago: verifica el pago CONTRA LA API de MP (nunca
   * confiar en el payload) y marca la orden pagada si está aprobado.
   */
  async handleMercadoPagoWebhook(query: Record<string, unknown>, body: unknown): Promise<{ ok: boolean }> {
    const client = this.mpClient;
    if (!client) return { ok: false };

    const b = (body ?? {}) as { type?: string; data?: { id?: string } };
    const type = (query['type'] as string) ?? b.type;
    const paymentId = (query['data.id'] as string) ?? b.data?.id;
    if (type !== 'payment' || !paymentId) return { ok: true }; // notificación que no nos aplica

    try {
      const payment = await new Payment(client).get({ id: paymentId });
      if (payment.status === 'approved' && payment.external_reference) {
        await this.orders.markPaid(payment.external_reference, String(payment.id));
        this.logger.log(`Orden ${payment.external_reference} pagada (MP ${payment.id})`);
      }
      return { ok: true };
    } catch (err) {
      this.logger.error(`Webhook MP: error verificando pago ${paymentId}`, err as Error);
      return { ok: false };
    }
  }
}
