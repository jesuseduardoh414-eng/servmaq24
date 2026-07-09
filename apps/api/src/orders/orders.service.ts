import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@servmaq/db';
import type { CheckoutInput, OrderDetail, OrderItem, OrderSummary } from '@servmaq/types';
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

  async create(userId: number, input: CheckoutInput): Promise<{ order: OrderSummary; total: number }> {
    if (input.items.length === 0) throw new BadRequestException('El carrito está vacío');

    // Precios desde la BD — jamás del cliente
    const ids = input.items.map((i) => i.productId);
    const products = await prisma.products.findMany({
      where: { id: { in: ids }, status: 1 },
      select: { id: true, name: true, cprice: true, photo: true, stock: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: OrderItem[] = input.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new BadRequestException(`Producto ${i.productId} no disponible`);
      const qty = Math.max(1, Math.min(999, Math.floor(i.qty)));
      return { productId: p.id, name: p.name, price: p.cprice, qty, image: imageUrl(p.photo) };
    });

    const total = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const cart: CartV2 = { v: 2, items };

    const o = await prisma.orders.create({
      data: {
        user_id: userId,
        cart: JSON.stringify(cart),
        method: METHOD_LABEL[input.method] ?? input.method,
        totalQty: String(totalQty),
        pay_amount: total,
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
