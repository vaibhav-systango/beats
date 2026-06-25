import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { SendOtpSwagger } from './decorators/swagger/send-otp.decorator';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpSwagger } from './decorators/swagger/verify-otp.decorator';
import { AuthMessages } from './constants/auth.constants';

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
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      return await this.authService.verifyOtp(verifyOtpDto);
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
}
