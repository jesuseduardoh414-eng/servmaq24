import { PrismaClient } from '@prisma/client';
import { defaultTheme, themeSchema } from '@servmaq/config';

/** Siembra el tema default (maquinaria) validándolo contra el schema. */
async function main() {
  const prisma = new PrismaClient();
  const theme = themeSchema.parse(defaultTheme);

  await prisma.theme.upsert({
    where: { slug: theme.slug },
    create: {
      slug: theme.slug,
      name: theme.name,
      active: theme.active,
      tokens: theme.tokens,
      copys: theme.copys,
      publishedAt: new Date(),
    },
    // Pre-admin (F1): sincroniza tokens/copys con el default para propagar
    // claves nuevas. CUANDO EXISTA EL EDITOR VISUAL (F4) esto debe volverse
    // un merge que respete las ediciones del admin — no un reemplazo.
    update: {
      tokens: theme.tokens,
      copys: theme.copys,
    },
  });

  console.log(`Tema "${theme.slug}" sembrado.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
