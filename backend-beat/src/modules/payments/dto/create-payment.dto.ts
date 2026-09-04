import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
      'Client-generated key. The same user + key returns the original payment instead of creating another.',
  })
  @IsOptional()
  @IsString()
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
    example: '01ARZ3NDEKTSV4RRFFQ69G5PRO',
    description:
      'Required when any selected session has promoter commission enabled.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9A-HJKMNP-TV-Z]{25,26}$/i)
  promoterUserId?: string;
}
