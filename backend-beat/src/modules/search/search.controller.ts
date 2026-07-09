import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './services/search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check active search provider connectivity and status' })
  @ApiResponse({ status: 200, description: 'Search provider is healthy' })
  @ApiResponse({ status: 503, description: 'Search provider is down or unreachable' })
  async healthCheck() {
    const health = await this.searchService.healthCheck();
    if (health.status === 'DOWN') {
      this.logger.error(`Search provider health check failed for provider: ${health.provider}`, health.details);
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
