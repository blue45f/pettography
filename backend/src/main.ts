import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveCorsOrigins } from './common/cors';
import { buildOpenApiConfig, createHelmetOptions } from './common/http-hardening';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  app.use(helmet(createHelmetOptions()));
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

  const openApiConfig = buildOpenApiConfig();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/docs', app, openApiDocument, {
    jsonDocumentUrl: 'api/docs-json',
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  // Bind to 0.0.0.0 so the server is reachable inside containers / PaaS hosts.
  await app.listen(port, '0.0.0.0');

  console.log(`[pettography-backend] listening on port ${port} (prefix /api)`);
}

void bootstrap();
