import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@maqserv/db';
import type { CheckoutInput, CouponCheck, OrderDetail, OrderItem, OrderSummary, OrderTotals, RentalPeriod } from '@maqserv/types';
import { toFulfillment } from '@maqserv/types';
import { checkoutSchema } from '@maqserv/config';
import { imageUrl } from '../catalog/images';
import { FreightService } from '../freight/freight.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FulfillmentService, toShipping } from './fulfillment.service';
import { StockService } from './stock.service';
import { hasRentalItems, parseCart, type CartV2 } from './cart.util';

/** Réplica del formato legacy: 4 chars alfanuméricos + unix timestamp. */
function newOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${rand}${Math.floor(Date.now() / 1000)}`;
}

const PERIOD_LABEL: Record<RentalPeriod, string> = { dia: 'DÍA', sem: 'SEMANA', mes: 'MES' };

/** Precio por periodo derivado del mensual (mismo criterio que el sitio). */
function periodPrice(base: number, key: RentalPeriod): number {
  if (key === 'mes') return base;
  if (key === 'sem') return Math.round(base / 4 / 100) * 100;
  return Math.round(base / 20 / 100) * 100;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

const METHOD_LABEL: Record<string, string> = {
  transferencia: 'Deposito bancario',
  mercadopago: 'MercadoPago',
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly freight: FreightService,
    private readonly notifications: NotificationsService,
    private readonly fulfillment: FulfillmentService,
    private readonly stock: StockService,
  ) {}

  private toSummary(o: {
    id: number; order_number: string; status: string; payment_status: string;
    method: string | null; pay_amount: number; totalQty: string; created_at: Date | null;
  }): OrderSummary {
    return {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      method: o.method ?? '',
      total: o.pay_amount,
      totalQty: Number(o.totalQty) || 0,
      createdAt: o.created_at ? o.created_at.toISOString() : null,
    };
  }

  /**
   * Tope de usos del cupón. `times` es texto en la BD legacy: vacío, null o basura
   * significan SIN LÍMITE. Fuente única para la vista previa y para el cobro.
   */
  private couponLimit(times: string | null): number | null {
    if (!times) return null;
    const n = parseInt(times, 10);
    return Number.isNaN(n) ? null : n;
  }

  /**
   * Gasta un uso del cupón, dentro de la transacción del checkout.
   *
   * El tope viaja en el WHERE (`used < límite`) en vez de comprobarse antes: si dos
   * checkouts entran a la vez con el último uso, los dos pasarían la comprobación previa
   * y el cupón se gastaría de más. Postgres evalúa el WHERE con la fila bloqueada, así
   * que solo uno lo consigue. Mismo patrón que el stock y que `/retiros`.
   */
  private async consumeCoupon(tx: Pick<typeof prisma, 'coupons'>, code: string): Promise<void> {
    const c = await tx.coupons.findFirst({ where: { code, status: 1 } });
    if (!c) throw new BadRequestException('El cupón no es válido o expiró');
    const limit = this.couponLimit(c.times);

    const r = await tx.coupons.updateMany({
      // Sin límite → no hay condición que poner: siempre se puede gastar.
      where: { code, status: 1, ...(limit !== null ? { used: { lt: limit } } : {}) },
      data: { used: { increment: 1 } },
    });
    if (r.count === 0) throw new BadRequestException('El cupón ya alcanzó su límite de usos');
  }

  /**
   * Valida un cupón contra el subtotal (type 0 = %, type 1 = monto fijo).
   * Nota: el legacy comparaba solo el día del mes (bug) — aquí fechas completas.
   */
  async checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
    const base: CouponCheck = { valid: false, reason: 'not_found', code, discount: 0, label: null };
    const c = await prisma.coupons.findFirst({ where: { code, status: 1 } });
    if (!c) return base;

    const now = new Date();
    const end = new Date(c.end_date);
    end.setHours(23, 59, 59, 999); // end_date inclusivo
    if (now < new Date(c.start_date) || now > end) return { ...base, reason: 'expired' };

    const times = this.couponLimit(c.times);
    if (times !== null && c.used >= times) {
      return { ...base, reason: 'exhausted' };
    }

    const discount = c.type === 0
      ? Math.round(subtotal * c.price) / 100
      : Math.min(c.price, subtotal);
    return {
      valid: true,
      reason: null,
      code,
      discount: Math.round(discount * 100) / 100,
      label: c.type === 0 ? `${c.price}%` : null,
    };
  }

  /** Ajustes de cobro (IVA/operador/traslado) del tema activo — Panel → Pagos y Traslado. */
  private async checkoutConfig() {
    const row = await prisma.theme.findFirst({ where: { active: true }, select: { tokens: true } });
    const tokens = (row?.tokens ?? {}) as { checkout?: unknown };
    return checkoutSchema.parse(tokens.checkout ?? {});
  }

  async create(userId: number, input: CheckoutInput): Promise<{ order: OrderSummary; total: number }> {
    if (input.items.length === 0) throw new BadRequestException('El carrito está vacío');

    // Precios desde la BD — jamás del cliente
    const ids = input.items.map((i) => i.productId);
    const products = await prisma.products.findMany({
      where: { id: { in: ids }, status: 1 },
      select: {
        id: true, name: true, cprice: true, photo: true, stock: true, user_id: true,
        is_rental: true, rental_freight: true,
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    // Renta: precio del PERIODO elegido (día/semana/mes) × cantidad. Sin fechas.
    const items: OrderItem[] = input.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new BadRequestException(`Producto ${i.productId} no disponible`);
      const qty = Math.max(1, Math.min(999, Math.floor(i.qty)));
      if (p.is_rental) {
        const period: RentalPeriod = i.period === 'dia' || i.period === 'sem' ? i.period : 'mes';
        return {
          productId: p.id, name: p.name, qty, image: imageUrl(p.photo),
          price: periodPrice(p.cprice, period), period, unitLabel: PERIOD_LABEL[period],
        };
      }
      return { productId: p.id, name: p.name, price: p.cprice, qty, image: imageUrl(p.photo) };
    });

    // Inventario: avisar AQUÍ, con el nombre del equipo y antes de cotizar el flete
    // (que sale a internet). El descuento real y atómico va abajo, en la transacción.
    const stockLines = this.stock.linesFor(items, 'all');
    this.stock.assertAvailable(stockLines, products);

    const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
    const totalQty = items.reduce((s, i) => s + i.qty, 0);

    // Cupón: validar server-side. El `used++` NO va aquí: vive en la transacción de
    // abajo, porque si la orden no llega a crearse (p. ej. sin stock) el cupón no
    // debe gastarse.
    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const check = await this.checkCoupon(input.couponCode, subtotal);
      if (!check.valid) throw new BadRequestException('El cupón no es válido o expiró');
      couponDiscount = check.discount;
      couponCode = check.code;
    }

    // Cobro configurable (Panel → Pagos): operador + IVA. El servidor manda.
    const cfg = await this.checkoutConfig();
    const operatorCost = input.operator && cfg.operator.enabled ? round2(totalQty * cfg.operator.amount) : 0;

    // Traslado (Panel → Traslado): se recalcula aquí con la dirección de la orden.
    // Nunca se toma el monto del navegador. Si no se puede calcular, cobra 0 y se cotiza aparte.
    const freightQuote = await this.freight.quote({
      address: [input.customer.address, input.customer.city, input.customer.zip ? `CP ${input.customer.zip}` : '']
        .filter(Boolean)
        .join(', '),
      items: input.items.map((i) => ({ productId: i.productId, qty: i.qty })),
    });
    const freightCost = freightQuote.status === 'ok' ? freightQuote.cost : 0;

    const taxable = round2(Math.max(0, subtotal - couponDiscount) + operatorCost + freightCost);
    // Si el precio YA incluye impuesto, no se suma nada (solo se desglosa en la vista).
    const tax = cfg.tax.enabled && !cfg.tax.included ? round2(taxable * (cfg.tax.rate / 100)) : 0;
    const total = round2(taxable + tax);

    const cart: CartV2 = {
      v: 2,
      items,
      totals: {
        subtotal, discount: couponDiscount, operator: operatorCost,
        freight: freightCost,
        freightKm: freightQuote.km,
        freightLabel: freightQuote.label,
        freightNote: freightQuote.status === 'ok' ? '' : freightQuote.message,
        tax, taxRate: cfg.tax.rate, taxLabel: cfg.tax.label,
        taxIncluded: cfg.tax.enabled && cfg.tax.included,
        total,
      },
    };

    /**
     * Todo lo que escribe va junto: descontar stock, gastar el cupón, crear la orden y
     * generar los vendor_orders. Si cualquiera falla, Postgres deshace el resto — antes,
     * un error después del `used++` dejaba el cupón gastado sin orden, y el stock se
     * habría apartado igual.
     *
     * El cotizador de flete se llamó ARRIBA a propósito: es una petición a internet y
     * no puede vivir dentro de la transacción reteniendo candados de fila.
     */
    const o = await prisma.$transaction(async (tx) => {
      await this.stock.hold(tx, stockLines, new Map(products.map((p) => [p.id, p.stock])));

      if (couponCode) await this.consumeCoupon(tx, couponCode);

      const created = await tx.orders.create({
      data: {
        user_id: userId,
        cart: Buffer.from(JSON.stringify(cart), 'utf8'),
        method: METHOD_LABEL[input.method] ?? input.method,
        totalQty: String(totalQty),
        pay_amount: total,
        coupon_code: couponCode,
        coupon_discount: couponDiscount > 0 ? String(couponDiscount) : null,
        order_number: newOrderNumber(),
        payment_status: 'Pending',
        status: 'pending',
        // El envío arranca esperando el pago; lo adelanta `markPaid` o el panel.
        fulfillment: 'pendiente',
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        customer_address: input.customer.address,
        customer_city: input.customer.city,
        customer_zip: input.customer.zip,
        order_note: input.note ?? null,
        currency_sign: '$',
        currency_value: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      });

      // NOTA: ya no se crean `rental_periods` — el modelo de renta es por PERIODO
      // (día/semana/mes) × cantidad, sin ventana de fechas. El periodo cobrado queda
      // en el cart de la orden (items[].period). Si algún día se vuelve a rentar por
      // fechas, aquí se reactiva el registro del periodo.

      // Marketplace: los items de productos de vendedor generan su vendor_order
      const vendorItems = input.items
        .map((i) => ({ input: i, product: byId.get(i.productId) }))
        .filter((x) => x.product && x.product.user_id > 0);
      if (vendorItems.length > 0) {
        await tx.vendor_orders.createMany({
          data: vendorItems.map(({ input: i, product: p }) => ({
            user_id: p!.user_id,
            order_id: created.id,
            qty: Math.max(1, Math.floor(i.qty)),
            price: Math.round(p!.cprice * Math.max(1, Math.floor(i.qty))),
            order_number: created.order_number,
            status: 'pending',
          })),
        });
      }

      return created;
    });

    return { order: this.toSummary(o), total };
  }

  async listByUser(userId: number): Promise<OrderSummary[]> {
    const rows = await prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { id: 'desc' },
      take: 50,
    });
    return rows.map((o) => this.toSummary(o));
  }

  async byNumber(userId: number, orderNumber: string): Promise<OrderDetail> {
    const o = await prisma.orders.findFirst({
      where: { order_number: orderNumber, user_id: userId },
    });
    if (!o) throw new NotFoundException('Orden no encontrada');
    const { items, totals } = parseCart(o.cart);
    return {
      ...this.toSummary(o),
      items,
      totals,
      shipping: toShipping(o),
      hasRental: hasRentalItems(items),
      customer: {
        name: o.customer_name,
        email: o.customer_email,
        phone: o.customer_phone,
        address: o.customer_address,
        city: o.customer_city,
        zip: o.customer_zip,
      },
      note: o.order_note,
    };
  }

  /** La usa el webhook de pagos para marcar la orden pagada. */
  async markPaid(orderNumber: string, txnid: string): Promise<void> {
    await prisma.orders.updateMany({
      where: { order_number: orderNumber },
      data: { payment_status: 'Completed', txnid, updated_at: new Date() },
    });
    const o = await prisma.orders.findFirst({
      where: { order_number: orderNumber },
      select: { id: true, order_number: true, user_id: true, fulfillment: true, ship_method: true },
    });
    // Aviso al cliente: el webhook llega cuando ya no está en el sitio.
    await this.notifications.push({
      userId: o?.user_id,
      type: 'payment_confirmed',
      title: `Confirmamos el pago de tu pedido ${orderNumber}`,
      body: 'Ya podemos programar el traslado de tu equipo.',
      link: `/pedido/${orderNumber}`,
      orderId: o?.id,
    });
    // El pago adelanta el envío a "Pagado" — en silencio, porque el aviso ya se mandó
    // arriba con el tipo `payment_confirmed` (el ícono de la campana depende del tipo).
    // Solo desde `pendiente`: un webhook que llega tarde no debe regresar una orden
    // que el panel ya movió a preparando/enviado.
    if (o && toFulfillment(o.fulfillment) === 'pendiente') {
      await this.fulfillment.setState(o, 'pagado', { note: 'Pago confirmado automáticamente', silent: true });
    }
  }
}
