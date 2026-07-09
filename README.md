# servmaq-platform

Migración del e-commerce B2B (maquinaria/médico) de `scava.website` desde Laravel 11 hacia **Next.js + NestJS + Prisma + MySQL**, con **sistema de diseño 100% configurable** (cada color, texto y botón se edita en runtime desde la BD, sin recompilar).

> Plan completo, fases y convenciones: en la memoria del agente (`migration-master-plan` y enlazados). Los agentes deben leer ese plan antes de trabajar aquí.

## Estructura

```
apps/
  web/      → Next.js (App Router) — tienda pública, SSR/SSG por SEO
  admin/    → (Fase 4) panel administrativo + editor visual de temas
  api/      → NestJS — API REST, un módulo por módulo de negocio
packages/
  config/   → @servmaq/config — schema Zod de tokens de tema + tema default
  db/       → @servmaq/db — Prisma (schema por introspección de la BD real)
  types/    → @servmaq/types — DTOs compartidos front↔back
  ui/       → @servmaq/ui — componentes base que consumen SOLO tokens
```

## Regla de oro (no negociable)

**Prohibido hardcodear** colores, tamaños, radios o textos visibles en componentes.
Todo sale de tokens CSS (`var(--color-primary)`, …) servidos por la API desde la BD,
o de copys por clave (`home.hero.title`). Si algo aún no es configurable, se crea el
token con valor por defecto — nunca un literal.

## Desarrollo

```bash
pnpm install
pnpm dev          # api :4000 + web :3000
```

Requiere MariaDB/MySQL corriendo (XAMPP en dev) con la BD `servmaq_dev`.
Variables: copia `packages/db/.env.example` → `packages/db/.env`.

## Fases

- **F0 Fundaciones** ← actual: monorepo, tokens, BD, DoD = cambiar un token en BD cambia la UI sin recompilar
- F1 Núcleo público (catálogo/SEO) · F2 Transaccional (pagos) · F3 B2B (RFQ/fletes/vendedores) · F4 Admin/CMS + editor visual
