import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@servmaq/db';
import type { CheckoutInput, CouponCheck, OrderDetail, OrderItem, OrderSummary } from '@servmaq/types';
import { imageUrl } from '../catalog/images';

/** Réplica del formato legacy: 4 chars alfanuméricos + unix timestamp. */
function newOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${rand}${Math.floor(Date.now() / 1000)}`;
}

/** Cart JSON de órdenes nuevas (v2). Las viejas están en bzip2 → items vacíos. */
interface CartV2 {
  v: 2;
  items: OrderItem[];
}

const METHOD_LABEL: Record<string, string> = {
  transferencia: 'Deposito bancario',
  mercadopago: 'MercadoPago',
};

@Injectable()
export class OrdersService {
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

  private parseCart(cart: string): OrderItem[] {
    // Órdenes del Laravel viejo: bzip2 (empieza con "BZh") → no legible aquí
    if (!cart.trimStart().startsWith('{')) return [];
    try {
      const parsed = JSON.parse(cart) as CartV2;
      return parsed.v === 2 && Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      return [];
    }
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

    const times = c.times ? parseInt(c.times, 10) : null;
    if (times !== null && !Number.isNaN(times) && c.used >= times) {
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

  async create(userId: number, input: CheckoutInput): Promise<{ order: OrderSummary; total: number }> {
    if (input.items.length === 0) throw new BadRequestException('El carrito está vacío');

    // Precios desde la BD — jamás del cliente
    const ids = input.items.map((i) => i.productId);
    const products = await prisma.products.findMany({
      where: { id: { in: ids }, status: 1 },
      select: { id: true, name: true, cprice: true, photo: true, stock: true, user_id: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: OrderItem[] = input.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new BadRequestException(`Producto ${i.productId} no disponible`);
      const qty = Math.max(1, Math.min(999, Math.floor(i.qty)));
      return { productId: p.id, name: p.name, price: p.cprice, qty, image: imageUrl(p.photo) };
    });

    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const cart: CartV2 = { v: 2, items };

    // Cupón: validar y aplicar server-side; incrementa `used` solo al usarse
    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const check = await this.checkCoupon(input.couponCode, subtotal);
      if (!check.valid) throw new BadRequestException('El cupón no es válido o expiró');
      couponDiscount = check.discount;
      couponCode = check.code;
      await prisma.coupons.updateMany({
        where: { code: check.code },
        data: { used: { increment: 1 } },
      });
    }
    const total = Math.max(0, Math.round((subtotal - couponDiscount) * 100) / 100);

    const o = await prisma.orders.create({
      data: {
        user_id: userId,
        cart: JSON.stringify(cart),
        method: METHOD_LABEL[input.method] ?? input.method,
        totalQty: String(totalQty),
        pay_amount: total,
        coupon_code: couponCode,
        coupon_discount: couponDiscount > 0 ? String(couponDiscount) : null,
        order_number: newOrderNumber(),
        payment_status: 'Pending',
        status: 'pending',
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

    // Marketplace: los items de productos de vendedor generan su vendor_order
    const vendorItems = input.items
      .map((i) => ({ input: i, product: byId.get(i.productId) }))
      .filter((x) => x.product && x.product.user_id > 0);
    if (vendorItems.length > 0) {
      await prisma.vendor_orders.createMany({
        data: vendorItems.map(({ input: i, product: p }) => ({
          user_id: p!.user_id,
          order_id: o.id,
          qty: Math.max(1, Math.floor(i.qty)),
          price: Math.round(p!.cprice * Math.max(1, Math.floor(i.qty))),
          order_number: o.order_number,
          status: 'pending',
        })),
      });
    }

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
    return {
      ...this.toSummary(o),
      items: this.parseCart(o.cart),
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
  }
}
