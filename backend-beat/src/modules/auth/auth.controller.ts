import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { SendOtpSwagger } from './decorators/swagger/send-otp.decorator';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpSwagger } from './decorators/swagger/verify-otp.decorator';
import { AuthMessages } from './constants/auth.constants';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
}
