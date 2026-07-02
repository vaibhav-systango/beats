import {
  Entity,
  Column,
  BeforeInsert,
  PrimaryColumn,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
} from 'typeorm';
import { ulid } from 'ulid';
import { Event, bigintTransformer } from './event.entity';

export enum AgeRestriction {
  ALL = 'ALL',
  _13_PLUS = '13_PLUS',
  _16_PLUS = '16_PLUS',
  _18_PLUS = '18_PLUS',
  _21_PLUS = '21_PLUS',
}

export enum SessionMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface EventAddress {
  placeId?: string;
  venueName?: string;
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ArtistMetadata {
  name: string;
  socialMediaUrl: string;
  category: string;
}

export interface MediaFile {
  url: string;
  mime_type: string;
  size: number;
  original_name: string;
}

export interface GalleryMediaFile {
  url: string;
  mime_type: string;
  size: number;
  original_name: string;
  sort_order: number;
}

export interface VideoMediaFile {
  url: string;
  mime_type: string;
  size: number;
  thumbnail_url: string;
  original_name: string;
}

export interface DocumentMediaFile {
  url: string;
  mime_type: string;
  size: number;
  original_name: string;
  doc_type: 'terms' | 'policy' | 'faq' | 'other' | string;
}

export interface EventSessionMedias {
  cover?: MediaFile;
  gallery?: GalleryMediaFile[];
  venue_gallery?: GalleryMediaFile[];
  videos?: VideoMediaFile[];
  documents?: DocumentMediaFile[];
  legal_documents?: DocumentMediaFile[];
}

@Entity('event_sessions')
export class EventSession {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'event_id',
    type: 'char',
    length: 26,
  })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title?: string;

  @Column({
    name: 'start_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  @Index()
  startAt: number;

  @Column({
    name: 'end_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  endAt: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location: any;

  @Column({
    name: 'event_address',
    type: 'jsonb',
  })
  eventAddress: EventAddress;

  @Column({
    type: 'integer',
  })
  capacity: number;

  @Column({
    name: 'age_restriction',
    type: 'enum',
    enum: AgeRestriction,
    default: AgeRestriction.ALL,
  })
  ageRestriction: AgeRestriction;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  languages?: string[];

  @Column({
    name: 'event_session_medias',
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  eventSessionMedias?: EventSessionMedias;

  @Column({
    type: 'enum',
    enum: SessionMode,
    default: SessionMode.OFFLINE,
  })
  mode: SessionMode;

  @Column({
    name: 'ticket_sale_start_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  ticketSaleStartAt: number;

  @Column({
    name: 'ticket_sale_end_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  ticketSaleEndAt: number;

  @Column({
    name: 'allow_referral',
    type: 'boolean',
    default: false,
  })
  allowReferral: boolean;

  @Column({
    name: 'referral_reward_per_ticket',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  referralRewardPerTicket?: number;

  @Column({
    name: 'allow_promoters',
    type: 'boolean',
    default: false,
  })
  allowPromoters: boolean;

  @Column({
    name: 'promoter_commission_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  promoterCommissionPercentage?: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  @Index()
  status: SessionStatus;

  @Column({
    name: 'created_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  createdAt: number;

  @Column({
    name: 'updated_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  updatedAt: number;

  @Column({
    name: 'deleted_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  deletedAt?: number;

  @Column({
    name: 'priority_weight',
    type: 'integer',
    nullable: true,
  })
  priorityWeight?: number;

  @Column({
    name: 'priority_expires_at',
    type: 'bigint',
    nullable: true,
    transformer: bigintTransformer,
  })
  priorityExpiresAt?: number;

  @Column({
    name: 'artist_metadata',
    type: 'jsonb',
    nullable: true,
  })
  artistMetadata?: ArtistMetadata;

  @BeforeInsert()
  preInsert(): void {
    if (!this.id) {
      this.id = ulid();
    }
    const now = Date.now();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.updatedAt) {
      this.updatedAt = now;
    }
  }

  @BeforeUpdate()
  updateTimestamp(): void {
    this.updatedAt = Date.now();
  }
}
