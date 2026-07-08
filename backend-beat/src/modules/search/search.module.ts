import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpenSearchClientProvider, RedisClientProvider } from './search.provider';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
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
    SearchService,
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
