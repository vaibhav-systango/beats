import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

/**
 * Builds Redis connection options from env for local Docker Redis and
 * managed providers (e.g. Upstash) that require password + TLS.
 *
 * Env:
 *   REDIS_HOST      (default: localhost)
 *   REDIS_PORT      (default: 6379)
 *   REDIS_PASSWORD  (optional)
 *   REDIS_TLS       (set "true" to enable TLS)
 */
export function buildRedisOptions(configService: ConfigService): RedisOptions {
  const host = configService.get<string>('REDIS_HOST', 'localhost');
  const port = parseInt(configService.get<string>('REDIS_PORT', '6379'), 10);
  const password = configService.get<string>('REDIS_PASSWORD');
  const tls = configService.get<string>('REDIS_TLS') === 'true';

  return {
    host,
    port,
    password: password || undefined,
    tls: tls ? {} : undefined,
  };
}
