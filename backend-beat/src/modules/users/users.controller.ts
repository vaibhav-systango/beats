import {
  Controller,
  Put,
  Body,
  Request,
  UseGuards,
  HttpException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { UserOnboardingDto } from './dto/user-onboarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserOnboardingSwagger } from './decorators/swagger/user-onboarding.decorator';
import { UsersConstants } from './constants/users.constants';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
  };
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  @UserOnboardingSwagger()
  async onboardUser(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UserOnboardingDto,
  ) {
    try {
      const userId = req.user.sub;
      return await this.usersService.onboardUser(userId, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      switch (message) {
        case UsersConstants.USER_NOT_FOUND:
          throw new HttpException({ message }, HttpStatus.NOT_FOUND);
        case UsersConstants.INVALID_CATEGORIES:
          throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
      }

      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: UsersConstants.UNEXPECTED_ERROR,
      });
    }
  }
}
