import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../database/entities/payment.entity';
import type { PaymentClientPayload } from '../providers/payment-provider.interface';

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
}
