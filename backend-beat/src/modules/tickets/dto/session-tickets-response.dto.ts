import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionTicketItemDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAX' })
  id: string;

  @ApiProperty({ example: 'General Admission' })
  name: string;

  @ApiPropertyOptional({ example: 'Standing', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 1599 })
  price: number;

  @ApiProperty({ example: 500 })
  quantity: number;

  @ApiProperty({ example: 500 })
  remainingQuantity: number;

  @ApiProperty({ example: 5 })
  maxPurchaseLimit: number;

  @ApiProperty({ example: 1751625600000 })
  saleStartAt: number;

  @ApiProperty({ example: 1754303999000 })
  saleEndAt: number;

  @ApiProperty({ example: false })
  isSoldOut: boolean;

  @ApiProperty({ example: true })
  canPurchase: boolean;
}

export class SessionTicketsResponseDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' })
  sessionId: string;

  @ApiPropertyOptional({ example: 'Night One', nullable: true })
  sessionTitle?: string | null;

  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAW' })
  eventId: string;

  @ApiProperty({ example: 'Summer Beats Festival' })
  eventTitle: string;

  @ApiProperty({ example: 1751625600000 })
  ticketSaleStartAt: number;

  @ApiProperty({ example: 1754303999000 })
  ticketSaleEndAt: number;

  @ApiProperty({ example: false })
  requireGuestName: boolean;

  @ApiProperty({ example: false })
  requireGuestAge: boolean;

  @ApiProperty({ example: false })
  allowReferral: boolean;

  @ApiProperty({ type: [SessionTicketItemDto] })
  tickets: SessionTicketItemDto[];
}
