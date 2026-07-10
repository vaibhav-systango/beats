import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { type RedisOptions } from 'ioredis';

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

export function attachRedisEventListeners(
  redis: Redis,
  context = 'Redis',
): void {
  const logger = new Logger(context);

  redis.on('connect', () => {
    logger.log('Redis connected');
  });

  redis.on('ready', () => {
    logger.log('Redis ready');
  });

  redis.on('error', (err: Error) => {
    logger.error(`Redis error: ${err.message}`, err.stack);
  });

  redis.on('reconnecting', () => {
    logger.warn('Redis reconnecting');
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('end', () => {
    logger.warn('Redis connection ended');
  });
}

/**
 * Creates an ioredis client from env and attaches connection lifecycle logs.
 */
export function createLoggedRedisClient(
  configService: ConfigService,
  context = 'Redis',
): Redis {
  const options = buildRedisOptions(configService);
  const logger = new Logger(context);

  logger.log(
    `Connecting to Redis at ${options.host}:${options.port} (tls=${Boolean(options.tls)}, auth=${Boolean(options.password)})`,
  );

  const redis = new Redis(options);
  attachRedisEventListeners(redis, context);
  return redis;
}
