import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { EventStatus } from '../entities/event.entity';
import { EventSession, SessionStatus } from '../entities/event-session.entity';

export interface MediaOwnershipContext {
  eventId: string;
  organizerId: string;
  status: EventStatus;
}

@Injectable()
export class EventSessionRepository extends Repository<EventSession> {
  constructor(dataSource: DataSource) {
    super(EventSession, dataSource.createEntityManager());
  }

  async findSessionsByEventId(eventId: string): Promise<EventSession[]> {
    return this.find({
      where: { eventId, deletedAt: IsNull() },
      order: { priorityWeight: 'DESC', startAt: 'ASC' },
    });
  }

  async findActiveSessionsByEventId(eventId: string): Promise<EventSession[]> {
    return this.find({
      where: { eventId, status: SessionStatus.ACTIVE, deletedAt: IsNull() },
      order: { priorityWeight: 'DESC', startAt: 'ASC' },
    });
  }

  async findMediaOwnershipContext(
    mediaKey: string,
  ): Promise<MediaOwnershipContext | null> {
    const normalizedKey = mediaKey.replace(/^\/+/, '');

    const row = await this.createQueryBuilder('session')
      .innerJoin('session.event', 'event')
      .select('event.id', 'eventId')
      .addSelect('event.organizerId', 'organizerId')
      .addSelect('event.status', 'status')
      .where('session.deletedAt IS NULL')
      .andWhere('event.deletedAt IS NULL')
      .andWhere(
        `(
          session.event_session_medias->'cover'->>'url' = :key
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(session.event_session_medias->'gallery', '[]'::jsonb)
            ) elem
            WHERE elem->>'url' = :key
          )
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(session.event_session_medias->'venue_gallery', '[]'::jsonb)
            ) elem
            WHERE elem->>'url' = :key
          )
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(session.event_session_medias->'videos', '[]'::jsonb)
            ) elem
            WHERE elem->>'url' = :key OR elem->>'thumbnail_url' = :key
          )
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(session.event_session_medias->'documents', '[]'::jsonb)
            ) elem
            WHERE elem->>'url' = :key
          )
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(
              COALESCE(session.event_session_medias->'legal_documents', '[]'::jsonb)
            ) elem
            WHERE elem->>'url' = :key
          )
        )`,
        { key: normalizedKey },
      )
      .limit(1)
      .getRawOne<MediaOwnershipContext>();

    return row ?? null;
  }
}
