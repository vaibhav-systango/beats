import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../database/entities/payment.entity';
import type { PaymentClientPayload } from '../providers/payment-provider.interface';
import { IssuedTicketPublicDto } from './issued-ticket-public.dto';

export class IssuedTicketReceiptItemDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5TIX' })
  id: string;

  @ApiProperty({ example: '01USER0000000000000000001' })
  ownerUserId: string;

  @ApiPropertyOptional({ example: 'Bhumi Rai', nullable: true })
  ownerName?: string | null;

  @ApiProperty({ example: 'VALID' })
  status: string;

  @ApiProperty({ example: '01TKT00000000000000000001' })
  ticketTypeId: string;

  @ApiProperty({ example: 'General Admission' })
  ticketTypeName: string;

  @ApiProperty({ example: 499 })
  price: number;

  @ApiProperty({ example: '01SES00000000000000000045' })
  sessionId: string;

  @ApiPropertyOptional({ example: 'Night One', nullable: true })
  sessionTitle?: string | null;

  @ApiPropertyOptional({ example: 1751625600000, nullable: true })
  sessionStartAt?: number | null;

  @ApiProperty({ example: '01EVT00000000000000000023' })
  eventId: string;

  @ApiProperty({ example: 'Summer Beats Festival' })
  eventTitle: string;

  @ApiPropertyOptional({ example: 'Mumbai', nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ example: 'NSCI Dome', nullable: true })
  venue?: string | null;

  @ApiPropertyOptional({ example: 'Alex Buyer', nullable: true })
  guestName?: string | null;

  @ApiPropertyOptional({ example: 28, nullable: true })
  guestAge?: number | null;

  @ApiProperty({ example: 1751625600000 })
  createdAt: number;
}

export class PaymentResponseDto {
  @ApiProperty({ example: '01ARZ3NDEKTSV4RRFFQ69G5FAX' })
  id: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({
    example: 199,
    description: 'Amount in INR rupees. Always INR.',
  })
  amount: number;

  @ApiProperty({ example: 'INR', description: 'Always INR' })
  currency: string;

  @ApiProperty({ example: 'STRIPE' })
  provider: string;

  @ApiPropertyOptional({ nullable: true })
  failureCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  failureMessage?: string | null;

  @ApiPropertyOptional({
    example: '01ARZ3NDEKTSV4RRFFQ69G5REF',
    nullable: true,
    description: 'Referrer user id when a referral was applied.',
  })
  referrerUserId?: string | null;

  @ApiProperty({ example: 1751625600000 })
  createdAt: number;

  @ApiProperty({ example: 1751625600000 })
  updatedAt: number;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Provider checkout payload. Omitted on GET. Never includes secret API keys.',
  })
  client?: PaymentClientPayload | null;

  @ApiPropertyOptional({
    type: [IssuedTicketReceiptItemDto],
    description: 'Issued tickets when payment has succeeded.',
  })
  tickets?: IssuedTicketReceiptItemDto[];
}

export { IssuedTicketPublicDto };
