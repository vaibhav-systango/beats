import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerifyOtpDto } from '../../dto/verify-otp.dto';

export function VerifyOtpSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify OTP for login or signup' }),
    ApiBody({
      type: VerifyOtpDto,
      examples: {
        'Valid Request': {
          value: {
            countryCode: '+91',
            phoneNumber: '9876543210',
            accountType: 'USER',
            otpCode: '123456',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'OTP verified successfully',
    }),
    ApiResponse({ status: 400, description: 'Bad Request / Invalid OTP' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
