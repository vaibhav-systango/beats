import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Redis from 'ioredis';

@Processor('search-analytics')
@Injectable()
export class SearchAnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchAnalyticsProcessor.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { id: jobId, name: jobName, data } = job;
    if (jobName !== 'track-search') {
      this.logger.warn(`Unknown job name: ${jobName}`);
      return;
    }

    try {
      const { query } = data;
      if (!query) return;

      const normalized = query.trim().toLowerCase();
      if (!normalized) return;

      const countsKey = 'search-analytics:counts';
      const timestampsKey = 'search-analytics:timestamps';

      // Increment count in Redis Sorted Set
      await this.redisClient.zincrby(countsKey, 1, normalized);

      // Update timestamp in Redis Hash
      await this.redisClient.hset(timestampsKey, normalized, Date.now().toString());

      this.logger.log(`Tracked search analytics for keyword: "${normalized}"`);
    } catch (error) {
      this.logger.error(`Error tracking search analytics for job ${jobId}`, error);
      throw error;
    }
  }
}
