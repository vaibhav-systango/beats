import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource, In } from 'typeorm';
import { SearchService } from '../services/search.service';
import { Event, EventStatus } from '../../../database/entities/event.entity';
import { EventSession, SessionStatus } from '../../../database/entities/event-session.entity';
import { SessionCategory } from '../../../database/entities/session-category.entity';

@Processor('search-sync')
@Injectable()
export class SearchSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchSyncProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly searchService: SearchService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { id: jobId, name: jobName, data } = job;
    this.logger.log(`Processing job ${jobId} of type ${jobName}`);

    try {
      switch (jobName) {
        case 'upsert-event': {
          const { eventId } = data;
          await this.handleUpsertEvent(eventId);
          break;
        }
        case 'delete-event': {
          const { eventId } = data;
          await this.searchService.deleteEventDocuments(eventId);
          break;
        }
        case 'delete-session': {
          const { sessionId } = data;
          await this.searchService.deleteSession(sessionId);
          break;
        }
        default:
          this.logger.warn(`Unknown job name: ${jobName}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job ${jobId} (${jobName})`, error);
      throw error; // BullMQ retries automatically
    }
  }

  private async handleUpsertEvent(eventId: string) {
    // Delete any existing sessions for this event to avoid stale data
    await this.searchService.deleteEventDocuments(eventId);

    const event = await this.dataSource.getRepository(Event).findOne({
      where: { id: eventId },
    });

    if (!event || event.deletedAt || event.status !== EventStatus.PUBLISHED) {
      this.logger.log(`Event ${eventId} is not active or published. Cleaned up index.`);
      return;
    }

    // Fetch active sessions
    const sessions = await this.dataSource.getRepository(EventSession).find({
      where: {
        eventId: event.id,
        status: SessionStatus.ACTIVE,
      },
    });

    const activeSessions = sessions.filter(s => !s.deletedAt);
    if (activeSessions.length === 0) {
      this.logger.log(`No active sessions found for event ${eventId}.`);
      return;
    }

    // Batch-load all SessionCategory rows for active sessions in one query
    const sessionIds = activeSessions.map((s) => s.id);
    const allSessionCategories = await this.dataSource.getRepository(SessionCategory).find({
      where: { sessionId: In(sessionIds) },
      relations: { category: true },
    });

    // Build a Map<sessionId, categoryName[]> for O(1) lookup per session
    const categoriesBySession = new Map<string, string[]>();
    for (const sc of allSessionCategories) {
      if (!sc.category?.name) continue;
      const existing = categoriesBySession.get(sc.sessionId);
      if (existing) {
        existing.push(sc.category.name);
      } else {
        categoriesBySession.set(sc.sessionId, [sc.category.name]);
      }
    }

    const docs: any[] = [];
    for (const session of activeSessions) {
      const categories = categoriesBySession.get(session.id) ?? [];

      // Map location geo_point
      let location: { lat: number; lon: number } | null = null;
      if (session.location && session.location.coordinates && session.location.coordinates.length >= 2) {
        location = {
          lat: session.location.coordinates[1],
          lon: session.location.coordinates[0],
        };
      }

      // priorityWeight calculation
      let priorityWeight = session.priorityWeight || 0;
      if (session.priorityExpiresAt && Number(session.priorityExpiresAt) < Date.now()) {
        priorityWeight = 0;
      }

      const doc = {
        sessionId: session.id,
        eventId: event.id,
        eventTitle: event.title,
        sessionTitle: session.title || null,
        description: event.description,
        artistName: extractArtistNames(session.artistMetadata),
        venue: session.eventAddress?.venueName || null,
        city: session.eventAddress?.city || null,
        categories,
        languages: session.languages || [],
        location,
        startAt: Number(session.startAt),
        endAt: Number(session.endAt),
        priorityWeight,
        priorityExpiresAt: session.priorityExpiresAt ? Number(session.priorityExpiresAt) : null,
        coverImage: session.eventSessionMedias?.cover?.url || null,
      };

      docs.push(doc);
    }

    if (docs.length > 0) {
      await this.searchService.bulkIndexSessions(docs);
      this.logger.log(`Successfully indexed ${docs.length} sessions for event ${eventId}.`);
    }
  }
}

function extractArtistNames(artistMetadata: any): string | null {
  if (!artistMetadata || typeof artistMetadata !== 'object') {
    return null;
  }
  const names: string[] = [];
  for (const key of Object.keys(artistMetadata)) {
    const value = artistMetadata[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && typeof item.name === 'string') {
          names.push(item.name.trim());
        }
      }
    }
  }
  return names.length > 0 ? names.join(', ') : null;
}
