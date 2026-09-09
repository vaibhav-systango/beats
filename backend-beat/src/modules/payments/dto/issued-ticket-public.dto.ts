import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Public scan payload — no guest/owner PII. */
export class IssuedTicketPublicDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5TIX' })
  id: string;

  @ApiProperty({ example: 'VALID' })
  status: string;

  @ApiProperty({ example: 'General Admission' })
  ticketTypeName: string;

  @ApiProperty({ example: 499 })
  price: number;

  @ApiProperty({ example: 'Summer Beats Festival' })
  eventTitle: string;

  @ApiPropertyOptional({ example: 'Night One', nullable: true })
  sessionTitle?: string | null;

  @ApiPropertyOptional({ example: 1751625600000, nullable: true })
  sessionStartAt?: number | null;

  @ApiPropertyOptional({ example: 'Mumbai', nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ example: 'NSCI Dome', nullable: true })
  venue?: string | null;

  @ApiProperty({ example: 1751625600000 })
  createdAt: number;
}
