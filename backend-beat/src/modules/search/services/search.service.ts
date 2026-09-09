import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export abstract class SearchService implements OnModuleInit {
  abstract onModuleInit(): Promise<void>;

  abstract setupIndex(): Promise<void>;

  abstract search(params: {
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
  }): Promise<{
    total: number;
    hits: Array<{
      sessionId: string;
      eventId: string;
      score: number;
      highlights: any;
    }>;
  }>;

  abstract getSuggestions(query: string): Promise<string[]>;

  abstract getTrendingSearches(): Promise<string[]>;

  abstract indexEventSession(doc: any): Promise<any>;

  abstract bulkIndexSessions(docs: any[]): Promise<any>;

  abstract deleteSession(sessionId: string): Promise<any>;

  abstract deleteEventDocuments(eventId: string): Promise<any>;

  abstract healthCheck(): Promise<{
    status: string;
    provider: string;
    details: any;
  }>;
}
