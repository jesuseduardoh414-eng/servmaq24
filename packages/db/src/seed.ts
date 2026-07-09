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
    update: {}, // si ya existe no lo pisamos: puede tener ediciones del admin
  });

  console.log(`Tema "${theme.slug}" sembrado.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
