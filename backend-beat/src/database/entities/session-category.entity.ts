import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { EventSession } from './event-session.entity';
import { EventCategory } from './event-category.entities';
import { bigintTransformer } from './event.entity';

@Entity('session_categories')
export class SessionCategory {
  @PrimaryColumn({
    name: 'session_id',
    type: 'char',
    length: 26,
  })
  sessionId: string;

  @PrimaryColumn({
    name: 'category_id',
    type: 'char',
    length: 26,
  })
  categoryId: string;

  @ManyToOne(() => EventSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: EventSession;

  @ManyToOne(() => EventCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: EventCategory;

  @Column({
    name: 'created_at',
    type: 'bigint',
    transformer: bigintTransformer,
  })
  createdAt: number;

  @BeforeInsert()
  preInsert(): void {
    if (!this.createdAt) {
      this.createdAt = Date.now();
    }
  }
}
