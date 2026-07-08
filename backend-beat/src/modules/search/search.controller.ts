import { Controller, Get, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    @Inject('OPENSEARCH_CLIENT') private readonly opensearchClient: Client,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check OpenSearch connectivity and events index existence' })
  @ApiResponse({ status: 200, description: 'OpenSearch and events index are healthy' })
  @ApiResponse({ status: 503, description: 'OpenSearch is down or unreachable' })
  async healthCheck() {
    try {
      // Ping cluster connection
      await this.opensearchClient.ping();

      // Check events index exists
      const existsResponse = await this.opensearchClient.indices.exists({
        index: 'events',
      });
      const indexExists = existsResponse.body !== undefined ? existsResponse.body : existsResponse;

      return {
        status: 'UP',
        opensearch: {
          connected: true,
          indexExists,
        },
      };
    } catch (error) {
      this.logger.error('OpenSearch connection health check failed', error);
      throw new ServiceUnavailableException({
        status: 'DOWN',
        error: 'OpenSearch connection failed',
      });
    }
  }
}
