import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';
import { PaymentMessages } from './constants/payments.constants';
import { PaymentWebhookSwagger } from './decorators/swagger/payment-webhook.decorator';
import { PaymentsService } from './services/payments.service';

@ApiTags('Payments')
@SkipThrottle()
@Controller('api/v1/payments/webhooks')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @PaymentWebhookSwagger()
  async handle(
    @Param('provider') provider: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      if (!req.rawBody) {
        throw new BadRequestException(PaymentMessages.MISSING_RAW_BODY);
      }
      return await this.paymentsService.handleWebhook(
        provider,
        req.rawBody,
        flattenHeaders(req.headers),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error handling payment webhook', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }
}

function flattenHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      result[key.toLowerCase()] = value;
    } else if (Array.isArray(value) && value[0]) {
      result[key.toLowerCase()] = value[0];
    }
  }
  return result;
}
