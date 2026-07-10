import { Client } from '@opensearch-project/opensearch';
import { ConfigService } from '@nestjs/config';
import { createLoggedRedisClient } from '../../config/redis.configuration';

export const OpenSearchClientProvider = {
  provide: 'OPENSEARCH_CLIENT',
  useFactory: (configService: ConfigService) => {
    const node = configService.get<string>('OPENSEARCH_NODE') || 'http://localhost:9200';
    return new Client({ node });
  },
  inject: [ConfigService],
};

export const RedisClientProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    return createLoggedRedisClient(configService, 'RedisClient');
  },
  inject: [ConfigService],
};
