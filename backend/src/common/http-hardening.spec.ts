import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../app.module';
import { buildOpenApiConfig, createHelmetOptions, resolveThrottleOptions } from './http-hardening';

describe('HTTP hardening configuration', () => {
  it('uses API-safe helmet defaults from sibling Nest services', () => {
    expect(createHelmetOptions()).toMatchObject({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    });
  });

  it('publishes a Pettography OpenAPI document config', () => {
    const config = buildOpenApiConfig();

    expect(config.info.title).toBe('Pettography API');
    expect(config.info.version).toBe('0.1.0');
    expect(config.info.description).toContain('rare pet');
  });

  it('normalizes throttle env values with safe defaults', () => {
    expect(resolveThrottleOptions()).toEqual([{ name: 'default', ttl: 60_000, limit: 120 }]);
    expect(resolveThrottleOptions({ ttlMs: '30000', limit: '25' })).toEqual([
      { name: 'default', ttl: 30_000, limit: 25 },
    ]);
    expect(resolveThrottleOptions({ ttlMs: '-1', limit: '0' })).toEqual([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]);
  });
});

describe('AppModule API hardening', () => {
  it('registers the throttler module and global guard', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[];
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) as unknown[];

    expect(imports.some(isThrottlerDynamicModule)).toBe(true);
    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: APP_GUARD, useClass: ThrottlerGuard }),
      ]),
    );
  });
});

function isThrottlerDynamicModule(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeModule = value as { module?: { name?: string } };
  return maybeModule.module?.name === 'ThrottlerModule';
}
