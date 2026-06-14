import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import compression from 'compression'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { resolveCorsOrigins } from './common/cors'
import { buildOpenApiConfig, createHelmetOptions } from './common/http-hardening'
import { ZodValidationPipe } from './common/zod-validation.pipe'
import { validateBackendEnv } from './config/env'
import { storeBackend } from './db/store-backend'

async function bootstrap(): Promise<void> {
  // 환경변수 비차단 검증 — 형식 오류/운영 안전하지 않은 기본값을 경고만 한다(부팅 안 깸).
  validateBackendEnv()

  // Neon 백엔드 하이드레이트 — 서비스 생성 전 캐시를 채운다(DATABASE_URL 없으면 no-op).
  await storeBackend.hydrate()

  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  // nestjs-pino Logger 를 Nest 의 기본 로거로 사용 — 부팅 로그까지 pino 로 흘려보낸다.
  app.useLogger(app.get(Logger))

  app.use(compression())
  app.use(helmet(createHelmetOptions()))
  app.setGlobalPrefix('api')

  // Zod 스키마(createZodDto) 기반 전역 검증. 미지정 키는 zod 기본 동작(strip)으로 제거된다.
  app.useGlobalPipes(new ZodValidationPipe())

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  })

  const openApiConfig = buildOpenApiConfig()
  // cleanupOpenApiDoc: createZodDto 가 붙인 zod 메타데이터를 OpenAPI 스키마로 정리한다.
  const openApiDocument = cleanupOpenApiDoc(SwaggerModule.createDocument(app, openApiConfig))
  SwaggerModule.setup('api/docs', app, openApiDocument, {
    jsonDocumentUrl: 'api/docs-json',
  })

  app.enableShutdownHooks()

  const port = Number(process.env.PORT ?? 3001)
  // Bind to 0.0.0.0 so the server is reachable inside containers / PaaS hosts.
  await app.listen(port, '0.0.0.0')

  console.log(`[pettography-backend] listening on port ${port} (prefix /api)`)
}

void bootstrap()
