import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { bigintTransformer } from './event.entity';
import { Payment } from './payment.entity';
import { SessionTicketType } from './session-ticket-type.entity';
import { EventSession } from './event-session.entity';
import { User } from './user.entity';

export enum IssuedTicketStatus {
  VALID = 'VALID',
  VOID = 'VOID',
}

@Entity('issued_tickets')
@Index('IDX_issued_tickets_payment_id', ['paymentId'])
@Index('IDX_issued_tickets_owner_user_id', ['ownerUserId'])
export class IssuedTicket {
  @PrimaryColumn({
    type: 'char',
    length: 26,
  })
  id: string;

  @Column({
    name: 'payment_id',
    type: 'char',
    length: 26,
  })
  paymentId: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  /** Current ticket holder. Set to buyer at issue; updated on resale transfer. */
  @Column({
    name: 'owner_user_id',
    type: 'char',
    length: 26,
  })
  ownerUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @Column({
    name: 'ticket_type_id',
    type: 'char',
    length: 26,
  })
  ticketTypeId: string;

  @ManyToOne(() => SessionTicketType)
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: SessionTicketType;

  @Column({
    name: 'session_id',
    type: 'char',
    length: 26,
  })
  sessionId: string;

  @ManyToOne(() => EventSession)
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @Column({
    type: 'enum',
    enum: IssuedTicketStatus,
    default: IssuedTicketStatus.VALID,
  })
  status: IssuedTicketStatus;

  @Column({
    name: 'guest_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  guestName?: string | null;

  @Column({
    name: 'guest_age',
    type: 'int',
    nullable: true,
  })
  guestAge?: number | null;

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
