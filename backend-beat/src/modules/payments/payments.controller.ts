import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UlidValidationPipe } from '../../common/pipes/ulid-validation.pipe';
import {
  PaymentConstants,
  PaymentMessages,
} from './constants/payments.constants';
import { CreatePaymentSwagger } from './decorators/swagger/create-payment.decorator';
import { GetPaymentSwagger } from './decorators/swagger/get-payment.decorator';
import { RefundPaymentSwagger } from './decorators/swagger/refund-payment.decorator';
import { VerifyPaymentSwagger } from './decorators/swagger/verify-payment.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentsService } from './services/payments.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { sub: string; role: string };
}

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: PaymentConstants.CREATE_LIMIT,
      ttl: PaymentConstants.CREATE_TTL_MS,
    },
  })
  @CreatePaymentSwagger()
  async create(
    @Body() dto: CreatePaymentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.paymentsService.createPayment(req.user.sub, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error creating payment', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @VerifyPaymentSwagger()
  async verify(
    @Param('id', UlidValidationPipe) id: string,
    @Body() dto: VerifyPaymentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.paymentsService.verifyPayment(req.user.sub, id, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error verifying payment', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @RefundPaymentSwagger()
  async refund(
    @Param('id', UlidValidationPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.paymentsService.refundPayment(
        req.user.sub,
        req.user.role,
        id,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error refunding payment', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @GetPaymentSwagger()
  async get(
    @Param('id', UlidValidationPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.paymentsService.getPayment(req.user.sub, id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching payment', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
