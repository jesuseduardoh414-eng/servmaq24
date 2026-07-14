'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Solo en DESARROLLO: cuando la pestaña del sitio vuelve a tener foco (p. ej.
 * después de publicar algo en el admin en otra pestaña), refresca los server
 * components para mostrar los cambios SIN recargar a mano (F5).
 *
 * No hace nada en producción. Los cambios de CÓDIGO ya se ven solos por Fast
 * Refresh de Next; esto cubre los cambios de CONTENIDO/tema del admin.
 */
export function DevAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const refresh = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);
  return null;
}
