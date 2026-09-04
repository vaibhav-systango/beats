import {
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { UserRole } from '../../common/enums/user.enums';
import { UlidValidationPipe } from '../../common/pipes/ulid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentMessages } from './constants/payments.constants';
import {
  AdminGetPaymentSwagger,
  AdminListPayoutsSwagger,
  AdminRunSettlementSwagger,
} from './decorators/swagger/payments-admin.decorator';
import { AdminPayoutsQueryDto } from './dto/admin-payouts-query.dto';
import { PaymentsService } from './services/payments.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { sub: string; role: string };
}

@ApiTags('Payments Admin')
@Controller('api/v1/admin')
export class PaymentsAdminController {
  private readonly logger = new Logger(PaymentsAdminController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments/:id')
  @UseGuards(JwtAuthGuard)
  @AdminGetPaymentSwagger()
  async getPayment(
    @Param('id', UlidValidationPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertAdmin(req);
    try {
      return await this.paymentsService.getAdminPayment(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching admin payment', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get('payouts')
  @UseGuards(JwtAuthGuard)
  @AdminListPayoutsSwagger()
  async listPayouts(
    @Query() query: AdminPayoutsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertAdmin(req);
    try {
      return await this.paymentsService.listAdminPayouts({
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error listing payouts', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post('settlements/run')
  @UseGuards(JwtAuthGuard)
  @AdminRunSettlementSwagger()
  async runSettlement(@Request() req: AuthenticatedRequest) {
    this.assertAdmin(req);
    try {
      return await this.paymentsService.runSettlement();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error running settlement', error);
      throw new InternalServerErrorException({
        message: PaymentMessages.UNEXPECTED_ERROR,
      });
    }
  }

  private assertAdmin(req: AuthenticatedRequest): void {
    if ((req.user.role as UserRole) !== UserRole.ADMIN) {
      throw new ForbiddenException(PaymentMessages.ADMIN_ONLY);
    }
  }
}
