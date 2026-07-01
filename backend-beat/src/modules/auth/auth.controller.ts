import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { SendOtpSwagger } from './decorators/swagger/send-otp.decorator';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpSwagger } from './decorators/swagger/verify-otp.decorator';
import { AuthMessages } from './constants/auth.constants';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRole } from '../../common/enums/user.enums';
import { UAParser } from 'ua-parser-js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @SendOtpSwagger()
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      return await this.authService.sendOtp(sendOtpDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      if (
        message.startsWith(AuthMessages.OTP_THROTTLED) ||
        message.startsWith(AuthMessages.TOO_MANY_ATTEMPTS)
      ) {
        throw new HttpException({ message }, HttpStatus.TOO_MANY_REQUESTS);
      }

      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post('verify-otp')
  @VerifyOtpSwagger()
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      const parser = new UAParser(userAgent);
      const parsedUserAgent = parser.getResult();

      const reqMetadata = {
        deviceName:
          parsedUserAgent.device.model ||
          parsedUserAgent.device.vendor ||
          'Unknown Device',
        platform: parsedUserAgent.os.name || 'Unknown Platform',
        browser: parsedUserAgent.browser.name || 'Unknown Browser',
        ipAddress: ipAddress || 'Unknown IP',
        userAgent: userAgent || 'Unknown User-Agent',
      };

      return await this.authService.verifyOtp(verifyOtpDto, reqMetadata);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      if (
        message === AuthMessages.INVALID_OTP ||
        message === AuthMessages.OTP_EXPIRED
      ) {
        throw new HttpException({ message }, HttpStatus.BAD_REQUEST);
      }

      if (
        message.startsWith(AuthMessages.TOO_MANY_ATTEMPTS) ||
        message.startsWith(AuthMessages.TOO_MANY_GUESSES)
      ) {
        throw new HttpException({ message }, HttpStatus.TOO_MANY_REQUESTS);
      }

      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshToken(refreshTokenDto.refreshToken);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      if (
        message === AuthMessages.INVALID_TOKEN ||
        message === AuthMessages.SESSION_NOT_FOUND
      ) {
        throw new HttpException({ message }, HttpStatus.UNAUTHORIZED);
      }

      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Get('sessions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: Request) {
    try {
      const userId = (req.user as { sub: string }).sub;
      return await this.authService.getSessions(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post('sessions/:sessionId/logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutSession(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ) {
    try {
      const { sub: userId, role } = req.user as { sub: string; role: string };
      const isAdmin = role === UserRole.ADMIN;
      return await this.authService.logoutSession(userId, sessionId, isAdmin);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const message = error instanceof Error ? error.message : String(error);

      if (message === AuthMessages.SESSION_NOT_FOUND) {
        throw new NotFoundException({ message });
      }
      if (message === AuthMessages.SESSION_FORBIDDEN) {
        throw new ForbiddenException({ message });
      }

      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }

  @Post('sessions/logout-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAllSessions(@Req() req: Request) {
    try {
      const userId = (req.user as { sub: string }).sub;
      return await this.authService.logoutAllSessions(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error occurred: ', error);
      throw new InternalServerErrorException({
        message: AuthMessages.UNEXPECTED_ERROR,
      });
    }
  }
}
