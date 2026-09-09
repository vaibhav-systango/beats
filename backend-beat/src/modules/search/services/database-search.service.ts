import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { SearchService } from './search.service';
import { Event, EventStatus } from '../../../database/entities/event.entity';
import { EventSession, SessionStatus } from '../../../database/entities/event-session.entity';

function parseRadiusToMeters(radiusStr: string): number {
  const match = radiusStr.match(/^(\d+(?:\.\d+)?)\s*(km|m|mi|miles)?$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  switch (unit) {
    case 'km':
      return value * 1000;
    case 'mi':
    case 'miles':
      return value * 1609.34;
    case 'm':
    default:
      return value;
  }
}

@Injectable()
export class DatabaseSearchService extends SearchService {
  private readonly logger = new Logger(DatabaseSearchService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
    super();
  }

  async onModuleInit() {
    this.logger.log('DatabaseSearchService initialized.');
  }

  async setupIndex() {
    this.logger.log('DatabaseSearchService setupIndex (no-op).');
    return Promise.resolve();
  }

  async indexEventSession(doc: any) {
    // No-op: Data is already in the PostgreSQL database
    return Promise.resolve();
  }

  async bulkIndexSessions(docs: any[]) {
    // No-op: Data is already in the PostgreSQL database
    return Promise.resolve();
  }

  async deleteSession(sessionId: string) {
    // No-op: Data is already in the PostgreSQL database
    return Promise.resolve();
  }

  async deleteEventDocuments(eventId: string) {
    // No-op: Data is already in the PostgreSQL database
    return Promise.resolve();
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || !query.trim()) return [];
    try {
      const prefix = `%${query.trim()}%`;

      const eventSuggestions = await this.dataSource
        .getRepository(Event)
        .createQueryBuilder('event')
        .select('event.title', 'title')
        .where('event.title ILIKE :prefix', { prefix })
        .andWhere('event.status = :eventStatus', { eventStatus: EventStatus.PUBLISHED })
        .andWhere('event.deletedAt IS NULL')
        .limit(10)
        .getRawMany();

      const sessionSuggestions = await this.dataSource
        .getRepository(EventSession)
        .createQueryBuilder('session')
        .select('session.title', 'title')
        .where('session.title ILIKE :prefix', { prefix })
        .andWhere('session.status = :sessionStatus', { sessionStatus: SessionStatus.ACTIVE })
        .andWhere('session.deletedAt IS NULL')
        .limit(10)
        .getRawMany();

      const suggestions = [
        ...eventSuggestions.map((e) => e.title),
        ...sessionSuggestions.map((s) => s.title),
      ].filter(Boolean);

      return Array.from(new Set(suggestions)).slice(0, 5);
    } catch (error) {
      this.logger.error(`Failed to fetch database suggestions for query: ${query}`, error);
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
    const limit = params.limit ?? 10;
    const offset = params.offset ?? 0;
    const now = Date.now();

    try {
      const queryBuilder = this.dataSource
        .getRepository(EventSession)
        .createQueryBuilder('session')
        .innerJoin('session.event', 'event')
        .select([
          'session.id AS "sessionId"',
          'event.id AS "eventId"',
        ])
        .where('event.status = :eventStatus', { eventStatus: EventStatus.PUBLISHED })
        .andWhere('event.deleted_at IS NULL')
        .andWhere('session.status = :sessionStatus', { sessionStatus: SessionStatus.ACTIVE })
        .andWhere('session.deleted_at IS NULL');

      // 1. Text Query
      let hasTextQuery = false;
      if (params.query && params.query.trim()) {
        hasTextQuery = true;
        const cleanTerms = params.query.trim().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
        
        if (cleanTerms.length > 0) {
          const tsQuery = cleanTerms.map((term) => `${term}:*`).join(' & ');
          queryBuilder.andWhere(
            `(
              to_tsvector('simple', coalesce(event.title, '')) @@ to_tsquery('simple', :tsQuery) OR
              to_tsvector('simple', coalesce(session.title, '')) @@ to_tsquery('simple', :tsQuery) OR
              to_tsvector('simple', coalesce(event.description, '')) @@ to_tsquery('simple', :tsQuery) OR
              to_tsvector('simple', coalesce(session.event_address->>'venue', '')) @@ to_tsquery('simple', :tsQuery) OR
              to_tsvector('simple', coalesce(session.artist_metadata::text, '')) @@ to_tsquery('simple', :tsQuery) OR
              event.title ILIKE :likeQuery OR
              session.title ILIKE :likeQuery OR
              session.artist_metadata::text ILIKE :likeQuery
            )`,
            {
              tsQuery,
              likeQuery: `%${params.query}%`,
            }
          );

          queryBuilder.addSelect(
            `ts_rank_cd(
              to_tsvector('simple', coalesce(event.title, '') || ' ' || coalesce(session.title, '') || ' ' || coalesce(event.description, '') || ' ' || coalesce(session.artist_metadata::text, '')),
              to_tsquery('simple', :tsQuery)
            ) + (CASE WHEN event.title ILIKE :likeQuery THEN 1.0 ELSE 0.0 END)`,
            'relevance_rank'
          );
        } else {
          queryBuilder.andWhere(
            `(event.title ILIKE :likeQuery OR session.title ILIKE :likeQuery OR event.description ILIKE :likeQuery OR session.artist_metadata::text ILIKE :likeQuery)`,
            { likeQuery: `%${params.query}%` }
          );
          queryBuilder.addSelect('0.5', 'relevance_rank');
        }
      } else {
        queryBuilder.addSelect('0', 'relevance_rank');
      }

      // 2. City Filter (JSONB field)
      if (params.city) {
        queryBuilder.andWhere("LOWER(session.event_address->>'city') = LOWER(:city)", { city: params.city });
      }

      // 3. Category Filter via subquery
      if (params.category) {
        queryBuilder.andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('1')
            .from('session_categories', 'sc')
            .innerJoin('event_categories', 'category', 'category.id = sc.category_id')
            .where('sc.session_id = session.id')
            .andWhere('category.name = :category', { category: params.category })
            .getQuery();
          return `EXISTS (${subQuery})`;
        });
      }

      // 4. Language Filter (checking in text array)
      if (params.language) {
        queryBuilder.andWhere(':language = ANY(session.languages)', { language: params.language });
      }

      // 5. Date Range
      if (params.dateFrom) {
        queryBuilder.andWhere('session.start_at >= :dateFrom', { dateFrom: params.dateFrom });
      }
      if (params.dateTo) {
        queryBuilder.andWhere('session.start_at <= :dateTo', { dateTo: params.dateTo });
      }

      // 5b. Session mode
      if (params.mode) {
        queryBuilder.andWhere('session.mode = :mode', { mode: params.mode });
      }

      // 5c. Ticket price range (rupees) via EXISTS on session_ticket_types
      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        queryBuilder.andWhere((qb) => {
          const subQueryBuilder = qb
            .subQuery()
            .select('1')
            .from('session_ticket_types', 'stt')
            .where('stt.session_id = session.id');

          if (params.minPrice !== undefined) {
            subQueryBuilder.andWhere('stt.price >= :minPrice');
          }
          if (params.maxPrice !== undefined) {
            subQueryBuilder.andWhere('stt.price <= :maxPrice');
          }

          return `EXISTS (${subQueryBuilder.getQuery()})`;
        });
        if (params.minPrice !== undefined) {
          queryBuilder.setParameter('minPrice', params.minPrice);
        }
        if (params.maxPrice !== undefined) {
          queryBuilder.setParameter('maxPrice', params.maxPrice);
        }
      }

      // 6. Geo Distance filter & select
      let hasGeo = false;
      if (params.lat !== undefined && params.lng !== undefined) {
        hasGeo = true;
        queryBuilder.addSelect(
          'ST_Distance(session.location::geography, ST_MakePoint(:lng, :lat)::geography)',
          'distance'
        );
        queryBuilder.setParameter('lng', params.lng);
        queryBuilder.setParameter('lat', params.lat);

        if (params.radius) {
          const radiusInMeters = parseRadiusToMeters(params.radius);
          queryBuilder.andWhere(
            'ST_DWithin(session.location::geography, ST_MakePoint(:lng, :lat)::geography, :radius)',
            { radius: radiusInMeters }
          );
        }
      } else {
        queryBuilder.addSelect('0', 'distance');
      }

      // 7. Priority Weight
      queryBuilder.addSelect(
        `CASE 
           WHEN session.priority_expires_at IS NULL OR session.priority_expires_at > :now 
           THEN COALESCE(session.priority_weight, 0) 
           ELSE 0 
         END`,
        'active_priority'
      );
      queryBuilder.setParameter('now', now);

      // Order by relevance, priority boost, geo-distance, and start time
      if (hasTextQuery) {
        queryBuilder.addOrderBy('relevance_rank', 'DESC');
      }
      queryBuilder.addOrderBy('active_priority', 'DESC');
      if (hasGeo) {
        queryBuilder.addOrderBy('distance', 'ASC', 'NULLS LAST');
      }
      queryBuilder.addOrderBy('session.start_at', 'ASC');

      const total = await queryBuilder.getCount();

      queryBuilder.offset(offset).limit(limit);
      const rawResults = await queryBuilder.getRawMany();

      return {
        total,
        hits: rawResults.map((row) => ({
          sessionId: row.sessionId,
          eventId: row.eventId,
          score: Number(row.relevance_rank || 0) + Number(row.active_priority || 0),
          highlights: {},
        })),
      };
    } catch (error) {
      this.logger.error('Database search query execution failed', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'UP',
        provider: 'database',
        details: {
          connected: true,
        },
      };
    } catch (error: any) {
      return {
        status: 'DOWN',
        provider: 'database',
        details: {
          connected: false,
          error: error.message,
        },
      };
    }
  }
}
