import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SearchService } from '../src/modules/search/services/search.service';
import { DataSource } from 'typeorm';
import { Event, EventStatus } from '../src/database/entities/event.entity';
import { EventSession, SessionStatus } from '../src/database/entities/event-session.entity';
import { SessionCategory } from '../src/database/entities/session-category.entity';

async function run() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('App context initialized.');

  const dataSource = app.get(DataSource);
  const searchService = app.get(SearchService);

  try {
    console.log('Checking OpenSearch index setup...');
    await searchService.setupIndex();

    console.log('Fetching published and active events...');
    const events = await dataSource.getRepository(Event).find({
      where: {
        status: EventStatus.PUBLISHED,
      },
    });

    const activeEvents = events.filter((e) => !e.deletedAt);
    console.log(`Found ${activeEvents.length} published and non-deleted events in database.`);

    const docs: any[] = [];

    for (const event of activeEvents) {
      console.log(`Processing event: ${event.title} (ID: ${event.id})...`);
      const sessions = await dataSource.getRepository(EventSession).find({
        where: {
          eventId: event.id,
          status: SessionStatus.ACTIVE,
        },
      });

      const activeSessions = sessions.filter((s) => !s.deletedAt);
      console.log(`- Found ${activeSessions.length} active sessions.`);

      for (const session of activeSessions) {
        // Fetch categories
        const sessionCategories = await dataSource.getRepository(SessionCategory).find({
          where: { sessionId: session.id },
          relations: { category: true },
        });
        const categories = sessionCategories
          .map((sc) => sc.category?.name)
          .filter(Boolean);

        // Map location geo_point
        let location: { lat: number; lon: number } | null = null;
        if (session.location && session.location.coordinates) {
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
    }

    if (docs.length > 0) {
      console.log(`Bulk indexing ${docs.length} sessions into OpenSearch...`);
      await searchService.bulkIndexSessions(docs);
      console.log('Bulk indexing complete.');
    } else {
      console.log('No sessions to index.');
    }
  } catch (error) {
    console.error('Error during bulk indexing execution', error);
  } finally {
    await app.close();
    console.log('NestJS app context closed.');
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

run().catch((err) => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
