import { DocumentBuilder } from '@nestjs/swagger';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import helmet from 'helmet';

const DEFAULT_THROTTLE_TTL_MS = 60_000;
const DEFAULT_THROTTLE_LIMIT = 120;

interface ThrottleEnv {
  ttlMs?: string;
  limit?: string;
}

export function createHelmetOptions(): Parameters<typeof helmet>[0] {
  return {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  };
}

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Pettography API')
    .setDescription(
      'rare pet species, care, location, community, marketplace, and consultation API.',
    )
    .setVersion('0.1.0')
    .build();
}

export function resolveThrottleOptions(
  env: ThrottleEnv = {
    ttlMs: process.env.API_THROTTLE_TTL_MS,
    limit: process.env.API_THROTTLE_LIMIT,
  },
): ThrottlerModuleOptions {
  return [
    {
      name: 'default',
      ttl: parsePositiveInteger(env.ttlMs, DEFAULT_THROTTLE_TTL_MS),
      limit: parsePositiveInteger(env.limit, DEFAULT_THROTTLE_LIMIT),
    },
  ];
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
