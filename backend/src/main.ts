import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { resolveCorsOrigins } from './common/cors';
import { buildOpenApiConfig, createHelmetOptions } from './common/http-hardening';
import { ZodValidationPipe } from './common/zod-validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  app.use(helmet(createHelmetOptions()));
  app.setGlobalPrefix('api');

  // Zod 스키마(createZodDto) 기반 전역 검증. 미지정 키는 zod 기본 동작(strip)으로 제거된다.
  app.useGlobalPipes(new ZodValidationPipe());

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });

  const openApiConfig = buildOpenApiConfig();
  // cleanupOpenApiDoc: createZodDto 가 붙인 zod 메타데이터를 OpenAPI 스키마로 정리한다.
  const openApiDocument = cleanupOpenApiDoc(SwaggerModule.createDocument(app, openApiConfig));
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
