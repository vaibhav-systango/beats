import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentAttendeeDto {
  @ApiPropertyOptional({ example: 'Alex Buyer' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestName?: string;

  @ApiPropertyOptional({ example: 28, minimum: 1, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  guestAge?: number;
}

export class CreatePaymentItemDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAX' })
  @IsString()
  ticketTypeId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;

  @ApiPropertyOptional({ type: [PaymentAttendeeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAttendeeDto)
  attendees?: PaymentAttendeeDto[];
}

export class CreatePaymentDto {
  @ApiProperty({ type: [CreatePaymentItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentItemDto)
  items: CreatePaymentItemDto[];

  @ApiPropertyOptional({
    example: 'checkout-01ARZ3NDEKTSV4RRFFQ69G5FAX',
    description:
      'Client-generated key. The same user + key returns the original payment instead of creating another. Whitespace-only values are rejected.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    example: '01ARZ3NDEKTSV4RRFFQ69G5REF',
    description:
      'Required when any selected session has referral rewards enabled.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-HJKMNP-TV-Z]{25,26}$/i)
  referrerUserId?: string;

  @ApiPropertyOptional({
    example: '01ARZ3NDEKTSV4RRFFQ69G5PRM',
    description:
      'Required when any selected session has promoter commission enabled.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-HJKMNP-TV-Z]{25,26}$/i)
  promoterUserId?: string;
}
