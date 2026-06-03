import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { resolveCorsOrigins } from './common/cors';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  // Bind to 0.0.0.0 so the server is reachable inside containers / PaaS hosts.
  await app.listen(port, '0.0.0.0');

  console.log(`[pettography-backend] listening on port ${port} (prefix /api)`);
}

void bootstrap();
