import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Orígenes permitidos por CORS. En prod se pasan por CORS_ORIGINS (coma-separado:
  // dominios de la tienda y del admin en Vercel); en dev se acepta cualquier localhost.
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins.length > 0 ? corsOrigins : [/localhost:\d+$/] });
  // Legacy: subidas antiguas servidas desde disco. Hoy todo vive en Supabase Storage,
  // así que en prod esta carpeta suele estar vacía (inofensivo).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API escuchando en el puerto ${port}`);
}

bootstrap();
