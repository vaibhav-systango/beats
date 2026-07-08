import { Client } from '@opensearch-project/opensearch';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

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
    return new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
    });
  },
  inject: [ConfigService],
};
