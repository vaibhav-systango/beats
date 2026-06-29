import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { EventCategory } from './event-category.entities';
import { ulid } from 'ulid';
import { UserOnboardingStatus } from '../../common/enums/user.enums';
import { Point } from 'geojson';

@Entity('users')
export class User {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  beforeInsert() {
    if (!this.id) {
      this.id = ulid();
    }
    const now = Date.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = Date.now();
  }

  @Column('char', { length: 26 })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'varchar', length: 150, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', length: 5 })
  countryCode: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profileImage?: string;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: Point;

  @Index()
  @Column({
    type: 'enum',
    enum: UserOnboardingStatus,
    default: UserOnboardingStatus.PROFILE_PENDING,
  })
  onboardingStatus: UserOnboardingStatus;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => EventCategory)
  @JoinTable({
    name: 'user_categories',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
  })
  categories: EventCategory[];

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'bigint' })
  updatedAt: number;

  @Column({ type: 'bigint', nullable: true })
  deletedAt: number;
}
