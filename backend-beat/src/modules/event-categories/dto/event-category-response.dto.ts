import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventCategoryResponseDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' })
  id: string;

  @ApiProperty({ example: 'Music' })
  name: string;

  @ApiPropertyOptional({ example: 'Live music concerts and festivals' })
  description?: string;

  @ApiProperty({ example: '2026-06-23T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-23T10:00:00.000Z' })
  updatedAt: Date;
}
