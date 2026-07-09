import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Dev: permitir a la tienda (3000) y al futuro admin (3001) consumir la API
  app.enableCors({ origin: [/localhost:\d+$/] });
  // Fotos subidas al sistema nuevo (productos de vendedor, etc.)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}`);
}

bootstrap();
