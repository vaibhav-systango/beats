import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiPropertyOptional({
    description:
      'Provider payment id from client checkout, if the provider returns one',
  })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @ApiPropertyOptional({
    description:
      'Provider order id from client checkout, if different from the stored one',
  })
  @IsOptional()
  @IsString()
  providerOrderId?: string;

  @ApiPropertyOptional({
    description:
      'Provider checkout signature, when the provider requires client-side verification',
  })
  @IsOptional()
  @IsString()
  signature?: string;
}
