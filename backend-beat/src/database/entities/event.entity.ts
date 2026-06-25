import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';

import { User } from './user.entity';
import { EventCategory } from './event-category.entities';
import type { GeoPoint } from '../../common/interfaces/geo-point.interface';

export enum EventStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('events')
export class Event {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @Column({
    name: 'organizer_id',
    type: 'char',
    length: 26,
  })
  organizerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizer_id' })
  organizer!: User;

  @Column({
    name: 'category_id',
    type: 'char',
    length: 26,
  })
  categoryId: string;

  @ManyToOne(() => EventCategory)
  @JoinColumn({ name: 'category_id' })
  category!: EventCategory;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  address?: {
    city: string;
    state: string;
    country: string;
  };

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: GeoPoint;

  @Column({
    name: 'start_datetime',
    type: 'timestamp',
  })
  startDatetime: Date;

  @Column({
    name: 'end_datetime',
    type: 'timestamp',
  })
  endDatetime: Date;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING_APPROVAL,
  })
  status: EventStatus;

  @Column({
    name: 'approved_at',
    type: 'timestamp',
    nullable: true,
  })
  approvedAt?: Date;

  @Column({
    name: 'approved_by',
    type: 'char',
    length: 26,
    nullable: true,
  })
  approvedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedByUser?: User;

  @Column({
    name: 'rejected_at',
    type: 'timestamp',
    nullable: true,
  })
  rejectedAt?: Date;

  @Column({
    name: 'rejected_by',
    type: 'char',
    length: 26,
    nullable: true,
  })
  rejectedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rejected_by' })
  rejectedByUser?: User;

  @Column({
    name: 'rejection_reason',
    type: 'text',
    nullable: true,
  })
  rejectionReason?: string;

  @Column({
    name: 'ticket_sale_start_at',
    type: 'timestamp',
    nullable: true,
  })
  ticketSaleStartAt?: Date;

  @Column({
    name: 'ticket_sale_end_at',
    type: 'timestamp',
    nullable: true,
  })
  ticketSaleEndAt?: Date;

  @Column({
    name: 'total_tickets',
    type: 'integer',
    nullable: true,
  })
  totalTickets?: number;

  @Column({
    name: 'allow_referrals',
    type: 'boolean',
    default: false,
  })
  allowReferrals: boolean;

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
    type: 'jsonb',
    nullable: false,
  })
  media: {
    cover?: string;
    gallery?: string[];
    videos?: string[];
    documents?: string[];
  };

  @Column({
    type: 'enum',
    enum: EventVisibility,
    default: EventVisibility.PUBLIC,
  })
  visibility: EventVisibility;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt?: Date;
}
