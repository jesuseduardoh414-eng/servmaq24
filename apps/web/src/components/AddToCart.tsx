'use client';

import { useState } from 'react';
import { Button } from '@servmaq/ui';
import { useCart, type CartItem } from '@/components/CartProvider';

/** Botón "añadir al carrito" del detalle de producto. No se renderiza en quoteMode (lo decide el server component). */
export function AddToCart({
  item,
  label,
  addedLabel,
}: {
  item: Omit<CartItem, 'qty'>;
  label: string;
  addedLabel: string;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size="lg"
      variant="outline"
      onClick={() => {
        cart.add(item);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? `✓ ${addedLabel}` : label}
    </Button>
  );
}
