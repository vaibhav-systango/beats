import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EventStatus } from '../../../database/entities/event.entity';

/**
 * Admin list filter values. `ACCEPTED` matches events with status PUBLISHED or APPROVED.
 */
export enum AdminEventsListFilter {
  PENDING_APPROVAL = EventStatus.PENDING_APPROVAL,
  PUBLISHED = EventStatus.PUBLISHED,
  REJECTED = EventStatus.REJECTED,
  APPROVED = EventStatus.APPROVED,
  ACCEPTED = 'ACCEPTED',
}

export class AdminPendingEventsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (default: 20, max: 100)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class AdminEventsQueryDto extends AdminPendingEventsQueryDto {
  @ApiProperty({
    enum: AdminEventsListFilter,
    example: AdminEventsListFilter.PENDING_APPROVAL,
    description:
      'Filter by review status. ACCEPTED returns PUBLISHED and APPROVED events.',
  })
  @IsEnum(AdminEventsListFilter)
  status: AdminEventsListFilter;
}

export class AdminPendingEventDto {
  @ApiProperty({ example: '01HQVN8K3M2P4R6S8T0W2X4Y6Z' })
  id: string;

  @ApiProperty({ example: 'Underground Pulse: Delhi Edition' })
  title: string;

  @ApiProperty({ enum: EventStatus, example: EventStatus.PENDING_APPROVAL })
  status: EventStatus;

  @ApiProperty({ example: 'Riya Sharma' })
  organiserName: string;

  @ApiProperty({
    nullable: true,
    example: 1_752_009_600_000,
    description: 'Start time of the first session (by priority), or null if none',
  })
  startAt: number | null;

  @ApiProperty({ example: 1_751_884_800_000, description: 'When the event was submitted for review' })
  submittedAt: number;
}

export class AdminPendingEventsPaginationDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export class AdminPendingEventsResponseDto {
  @ApiProperty({ type: [AdminPendingEventDto] })
  data: AdminPendingEventDto[];

  @ApiProperty({ type: AdminPendingEventsPaginationDto })
  pagination: AdminPendingEventsPaginationDto;
}
