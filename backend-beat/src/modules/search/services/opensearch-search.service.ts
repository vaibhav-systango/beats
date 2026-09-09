import { Injectable, Inject, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import Redis from 'ioredis';
import { SearchService } from './search.service';
import { DatabaseSearchService } from './database-search.service';

@Injectable()
export class OpenSearchSearchService extends SearchService {
  private readonly logger = new Logger(OpenSearchSearchService.name);

  constructor(
    @Inject('OPENSEARCH_CLIENT') private readonly opensearchClient: Client,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly databaseSearchService: DatabaseSearchService,
  ) {
    super();
  }

  async onModuleInit() {
    try {
      await this.setupIndex();
    } catch (error) {
      this.logger.error('Failed to setup OpenSearch index on startup', error);
    }
  }

  async setupIndex() {
    const indexName = 'events';
    try {
      const existsResponse = await this.opensearchClient.indices.exists({
        index: indexName,
      });
      const exists = existsResponse.body !== undefined ? existsResponse.body : existsResponse;

      if (exists) {
        this.logger.log(`OpenSearch index "${indexName}" already exists.`);
        return;
      }

      this.logger.log(`OpenSearch index "${indexName}" not found. Creating index...`);
      await this.opensearchClient.indices.create({
        index: indexName,
        body: {
          settings: {
            index: {
              analysis: {
                filter: {
                  synonyms_filter: {
                    type: 'synonym',
                    synonyms: [
                      'edm, electronic dance music, house music, techno',
                      'dj, disc jockey, turntablist',
                      'standup, stand-up comedy, comedy show, comic',
                      'hiphop, hip-hop, rap, rapper',
                    ],
                  },
                },
                analyzer: {
                  synonyms_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'synonyms_filter'],
                  },
                },
              },
            },
          },
          mappings: {
            properties: {
              sessionId: { type: 'keyword' },
              eventId: { type: 'keyword' },
              eventTitle: { type: 'search_as_you_type' },
              sessionTitle: { type: 'search_as_you_type' },
              description: {
                type: 'text',
                analyzer: 'synonyms_analyzer',
                search_analyzer: 'synonyms_analyzer',
              },
              artistName: {
                type: 'text',
                analyzer: 'synonyms_analyzer',
                search_analyzer: 'synonyms_analyzer',
              },
              venue: {
                type: 'text',
                analyzer: 'synonyms_analyzer',
                search_analyzer: 'synonyms_analyzer',
              },
              city: { type: 'keyword' },
              categories: { type: 'keyword' },
              languages: { type: 'keyword' },
              location: { type: 'geo_point' },
              priorityWeight: { type: 'integer' },
              priorityExpiresAt: { type: 'date' },
              startAt: { type: 'date' },
              endAt: { type: 'date' },
              coverImage: { type: 'keyword', index: false },
            },
          },
        },
      });
      this.logger.log(`OpenSearch index "${indexName}" created successfully.`);
    } catch (error) {
      this.logger.error('Error during index checking/creation', error);
      throw error;
    }
  }

  async indexEventSession(doc: any) {
    try {
      return await this.opensearchClient.index({
        index: 'events',
        id: doc.sessionId,
        body: doc,
      });
    } catch (error) {
      this.logger.error(`Failed to index event session ${doc.sessionId}`, error);
      throw error;
    }
  }

  async bulkIndexSessions(docs: any[]) {
    if (docs.length === 0) return;
    try {
      const body: any[] = [];
      for (const doc of docs) {
        body.push({ index: { _index: 'events', _id: doc.sessionId } });
        body.push(doc);
      }
      return await this.opensearchClient.bulk({ body });
    } catch (error) {
      this.logger.error('Failed to bulk index sessions', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string) {
    try {
      await this.opensearchClient.delete({
        index: 'events',
        id: sessionId,
      });
    } catch (error: any) {
      const status = error.statusCode || error.status;
      if (status === 404) {
        this.logger.warn(`Session ${sessionId} not found for deletion in OpenSearch`);
      } else {
        this.logger.error(`Failed to delete session ${sessionId} from OpenSearch`, error);
        throw error;
      }
    }
  }

  async deleteEventDocuments(eventId: string) {
    try {
      return await this.opensearchClient.deleteByQuery({
        index: 'events',
        body: {
          query: {
            term: { eventId },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to delete documents for event ${eventId} from OpenSearch`, error);
      throw error;
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || !query.trim()) return [];
    try {
      const response = await this.opensearchClient.search({
        index: 'events',
        body: {
          query: {
            multi_match: {
              query,
              type: 'bool_prefix',
              fields: [
                'eventTitle',
                'eventTitle._2gram',
                'eventTitle._3gram',
                'sessionTitle',
                'sessionTitle._2gram',
                'sessionTitle._3gram',
              ],
            },
          },
          size: 10,
        },
      });
      const body = (response.body !== undefined ? response.body : response) as any;
      const suggestions: string[] = [];
      const hits = body?.hits?.hits || [];

      for (const hit of hits) {
        const source = hit._source;
        if (source.eventTitle) {
          suggestions.push(source.eventTitle);
        }
        if (source.sessionTitle) {
          suggestions.push(source.sessionTitle);
        }
      }
      return Array.from(new Set(suggestions)).slice(0, 5);
    } catch (error) {
      this.logger.error(`Failed to fetch suggestions for query: ${query}`, error);
      return [];
    }
  }

  async getTrendingSearches(): Promise<string[]> {
    try {
      const key = 'search-analytics:counts';
      const trending = await this.redisClient.zrevrange(key, 0, 9);
      return trending;
    } catch (error) {
      this.logger.error('Failed to fetch trending searches from Redis', error);
      return [];
    }
  }

  async search(params: {
    query?: string;
    city?: string;
    category?: string;
    dateFrom?: number;
    dateTo?: number;
    language?: string;
    lat?: number;
    lng?: number;
    radius?: string;
    limit?: number;
    offset?: number;
    minPrice?: number;
    maxPrice?: number;
    mode?: string;
  }) {
    // Price/mode are not in the OpenSearch mapping — use SQL so pagination stays correct.
    if (
      params.minPrice !== undefined ||
      params.maxPrice !== undefined ||
      params.mode
    ) {
      return this.databaseSearchService.search(params);
    }

    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;

    const must: any[] = [];
    const filter: any[] = [];

    if (params.query && params.query.trim()) {
      must.push({
        multi_match: {
          query: params.query,
          fields: ['eventTitle^5', 'artistName^4', 'venue^3', 'city^2', 'description'],
          fuzziness: 'AUTO',
          analyzer: 'synonyms_analyzer',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (params.city) {
      filter.push({ term: { city: params.city } });
    }
    if (params.category) {
      filter.push({ term: { categories: params.category } });
    }
    if (params.language) {
      filter.push({ term: { languages: params.language } });
    }

    const dateRange: any = {};
    if (params.dateFrom) {
      dateRange.gte = params.dateFrom;
    }
    if (params.dateTo) {
      dateRange.lte = params.dateTo;
    }
    if (Object.keys(dateRange).length > 0) {
      filter.push({ range: { startAt: dateRange } });
    }

    // Only apply strict geo_distance filter if a radius is explicitly requested
    if (params.lat !== undefined && params.lng !== undefined && params.radius) {
      filter.push({
        geo_distance: {
          distance: params.radius,
          location: {
            lat: params.lat,
            lon: params.lng,
          },
        },
      });
    }

    const functions: any[] = [
      {
        field_value_factor: {
          field: 'priorityWeight',
          factor: 1,
          missing: 0,
          modifier: 'none',
        },
        weight: 1.5,
      },
      {
        gauss: {
          startAt: {
            origin: Date.now(),
            scale: '7d',
            offset: '0',
            decay: 0.5,
          },
        },
        weight: 1.0,
      },
    ];

    if (params.lat !== undefined && params.lng !== undefined) {
      functions.push({
        gauss: {
          location: {
            origin: { lat: params.lat, lon: params.lng },
            scale: '50km',
            offset: '0km',
            decay: 0.5,
          },
        },
        weight: 2.0,
      });
    }

    const sort: any[] = [];
    if (params.lat !== undefined && params.lng !== undefined) {
      if (params.query && params.query.trim()) {
        sort.push({ _score: 'desc' });
        sort.push({
          _geo_distance: {
            location: { lat: params.lat, lon: params.lng },
            order: 'asc',
            unit: 'km',
            mode: 'min',
            distance_type: 'arc',
            ignore_unmapped: true,
          },
        });
      } else {
        sort.push({
          _geo_distance: {
            location: { lat: params.lat, lon: params.lng },
            order: 'asc',
            unit: 'km',
            mode: 'min',
            distance_type: 'arc',
            ignore_unmapped: true,
          },
        });
        sort.push({ _score: 'desc' });
      }
    } else {
      sort.push({ _score: 'desc' });
    }
    sort.push({ startAt: 'asc' });

    const bodyQuery = {
      query: {
        function_score: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          functions,
          score_mode: 'sum',
          boost_mode: 'sum',
        },
      },
      sort,
      from: offset,
      size: limit,
      highlight: {
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
        fields: {
          eventTitle: {},
          sessionTitle: {},
          description: {},
          artistName: {},
          venue: {},
          city: {},
        },
      },
    };

    const response = await this.opensearchClient.search({
      index: 'events',
      body: bodyQuery as any,
    }, {
      requestTimeout: 2000,
    } as any);

    const body = (response.body !== undefined ? response.body : response) as any;
    const hits = body?.hits?.hits || [];
    const total = body?.hits?.total?.value || 0;

    return {
      total,
      hits: hits.map((hit: any) => ({
        sessionId: hit._id,
        eventId: hit._source.eventId,
        score: hit._score,
        highlights: hit.highlight || {},
      })),
    };
  }

  async healthCheck() {
    try {
      await this.opensearchClient.ping();
      const existsResponse = await this.opensearchClient.indices.exists({
        index: 'events',
      });
      const indexExists = existsResponse.body !== undefined ? existsResponse.body : existsResponse;
      return {
        status: 'UP',
        provider: 'opensearch',
        details: {
          connected: true,
          indexExists,
        },
      };
    } catch (error: any) {
      return {
        status: 'DOWN',
        provider: 'opensearch',
        details: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}
