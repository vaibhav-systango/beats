import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventCategoryMessages } from '../constants/event-category.constants';

export class CreateEventCategoryDto {
  @ApiProperty({
    example: 'Music',
    description: 'Category name',
    maxLength: 100,
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().replace(/\s+/g, ' ');
    return normalized.length > 0 ? normalized : undefined;
  })
  @IsString()
  @IsNotEmpty({ message: EventCategoryMessages.NAME_REQUIRED })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Live music concerts and festivals',
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
