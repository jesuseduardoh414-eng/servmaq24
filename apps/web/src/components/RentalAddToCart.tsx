'use client';

import { useMemo, useState } from 'react';
import { Button, Input } from '@maqserv/ui';
import { useCart } from '@/components/CartProvider';
import { formatPrice } from '@/lib/format';

/**
 * Date Range Picker de renta (brief Hito 4): fechas de inicio y retorno.
 * Precio = (precio diario × días) + flete. El server lo recalcula igual.
 */
export function RentalAddToCart({
  item,
  pricePerDay,
  freight,
  labels,
}: {
  item: { productId: number; slug: string; name: string; image: string | null };
  pricePerDay: number;
  freight: number;
  labels: { start: string; end: string; days: string; freight: string; total: string; add: string; added: string };
}) {
  const cart = useCart();
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState('');
  const [added, setAdded] = useState(false);

  const days = useMemo(() => {
    if (!start || !end) return 0;
    const diff = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [start, end]);

  const total = days > 0 ? pricePerDay * days + freight : 0;

  function add() {
    if (days <= 0) return;
    cart.add({ ...item, price: pricePerDay, rental: { startDate: start, endDate: end, days, freight } });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const lbl = 'grid gap-1 text-(length:--text-sm) text-ink-muted';

  return (
    <div className="grid gap-3 bg-panel border border-line rounded-(--radius-md) p-4 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <label className={lbl}>
          {labels.start}
          <Input type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className={lbl}>
          {labels.end}
          <Input type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      {days > 0 ? (
        <div className="grid gap-1 text-(length:--text-sm)">
          <span className="text-ink-muted">
            {days} {labels.days} × {formatPrice(pricePerDay)}
            {freight > 0 ? <> + {labels.freight} {formatPrice(freight)}</> : null}
          </span>
          <strong className="text-brand text-(length:--text-lg) tabular-nums">
            {labels.total}: {formatPrice(total)}
          </strong>
        </div>
      ) : null}
      <div>
        <Button size="lg" onClick={add} disabled={days <= 0}>
          {added ? `✓ ${labels.added}` : labels.add}
        </Button>
      </div>
    </div>
  );
}
