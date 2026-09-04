import { Entity, Column, PrimaryColumn, BeforeInsert, Index } from 'typeorm';
import { ulid } from 'ulid';
import { bigintTransformer } from './event.entity';

@Entity('payment_webhook_events')
@Index(
  'UQ_payment_webhook_events_provider_event',
  ['provider', 'providerEventId'],
  {
    unique: true,
  },
)
export class PaymentWebhookEvent {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    type: 'varchar',
    length: 64,
  })
  provider: string;

  @Column({
    name: 'provider_event_id',
    type: 'varchar',
    length: 255,
  })
  providerEventId: string;

  @Column({
    name: 'payment_id',
    type: 'char',
    length: 26,
    nullable: true,
  })
  paymentId?: string | null;

  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 64,
  })
  eventType: string;

  @Column({
    name: 'created_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  createdAt: number;

  @BeforeInsert()
  preInsert(): void {
    if (!this.id) {
      this.id = ulid();
    }
    if (!this.createdAt) {
      this.createdAt = Date.now();
    }
  }
}
