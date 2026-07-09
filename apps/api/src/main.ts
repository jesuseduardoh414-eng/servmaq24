import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Dev: permitir a la tienda (3000) y al futuro admin (3001) consumir la API
  app.enableCors({ origin: [/localhost:\d+$/] });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}`);
}

bootstrap();
