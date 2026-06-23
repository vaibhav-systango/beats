import { OtpPurpose } from '../../common/enums/otp.enums';
import { UserRole } from '../../common/enums/user.enums';
import { Entity, Column, PrimaryColumn, BeforeInsert, Index } from 'typeorm';
import { ulid } from 'ulid';

@Entity({ name: 'otps' })
@Index(['countryCode', 'phoneNumber', 'accountType', 'purpose'], {
  unique: true,
})
export class Otp {
  @PrimaryColumn('char', { length: 26 })
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @Column({
    name: 'countryCode',
    type: 'varchar',
    length: 5,
  })
  countryCode: string;

  @Column({
    name: 'phoneNumber',
    type: 'varchar',
    length: 15,
  })
  phoneNumber: string;

  @Column({
    name: 'accountType',
    type: 'enum',
    enum: UserRole,
  })
  accountType: UserRole;

  @Column({
    name: 'purpose',
    type: 'enum',
    enum: OtpPurpose,
  })
  purpose: OtpPurpose;

  @Column({
    name: 'otpCode',
    type: 'varchar',
    length: 6,
  })
  otpCode: string;

  @Column({
    name: 'otpLimit',
    type: 'int',
    default: 3,
  })
  otpLimit: number;

  @Column({
    name: 'failedAttempts',
    type: 'int',
    default: 0,
  })
  failedAttempts: number;

  @Column({
    name: 'createdAt',
    type: 'bigint',
  })
  createdAt: number;

  @Column({
    name: 'updatedAt',
    type: 'bigint',
  })
  updatedAt: number;
}
