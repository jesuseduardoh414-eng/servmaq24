'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Contador animado 0→N al entrar en viewport (detalle del diseño SEGAshop en
 * las tarjetas de estadísticas). Recibe el valor como STRING de copy
 * (p. ej. "500+", "+5,000", "98%") y conserva prefijo/sufijo tal cual:
 * el texto sigue siendo configurable desde el tema.
 */
export function CountUp({ value, style }: { value: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Aísla la porción numérica CON separadores (comas/puntos), p. ej. "5,000"
    // dentro de "5,000+". Partir por los dígitos "pelados" ("5000") fallaba
    // cuando el copy tenía coma (no hacía match → suffix `undefined`).
    const match = value.match(/[\d][\d.,]*\d|\d/);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Sin número o con reduce-motion: mostrar el copy tal cual, sin animar.
    if (!match || reduce) {
      setDisplay(value);
      return;
    }
    const numStr = match[0];
    const target = parseInt(numStr.replace(/[^\d]/g, ''), 10);
    const prefix = value.slice(0, match.index);
    const suffix = value.slice((match.index ?? 0) + numStr.length);
    const fmt = (n: number) => (target >= 1000 ? n.toLocaleString('en-US') : String(n));

    let raf = 0;
    let started = false;
    const animate = () => {
      const dur = 1400;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(`${prefix}${fmt(Math.round(target * eased))}${suffix}`);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setDisplay(`${prefix}0${suffix}`);
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started) {
            started = true;
            animate();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} style={style}>
      {display}
    </span>
  );
}
