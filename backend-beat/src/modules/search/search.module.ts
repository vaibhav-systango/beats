import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { OpenSearchClientProvider, RedisClientProvider } from './search.provider';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { OpenSearchSearchService } from './services/opensearch-search.service';
import { DatabaseSearchService } from './services/database-search.service';
import { SearchSyncProcessor } from './processors/search-sync.processor';
import { SearchAnalyticsProcessor } from './processors/search-analytics.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'search-sync',
    }),
    BullModule.registerQueue({
      name: 'search-analytics',
    }),
  ],
  providers: [
    OpenSearchClientProvider,
    RedisClientProvider,
    OpenSearchSearchService,
    DatabaseSearchService,
    {
      provide: SearchService,
      useFactory: (
        configService: ConfigService,
        openSearchService: OpenSearchSearchService,
        dbSearchService: DatabaseSearchService,
      ) => {
        const provider = configService.get<string>('SEARCH_PROVIDER') || 'opensearch';
        return provider === 'database' ? dbSearchService : openSearchService;
      },
      inject: [ConfigService, OpenSearchSearchService, DatabaseSearchService],
    },
    SearchSyncProcessor,
    SearchAnalyticsProcessor,
  ],
  controllers: [
    SearchController,
  ],
  exports: [
    'OPENSEARCH_CLIENT',
    'REDIS_CLIENT',
    SearchService,
    BullModule,
  ],
})
export class SearchModule {}
