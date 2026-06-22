import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendOtpDto } from '../../dto/send-otp.dto';

export function SendOtpSwagger() {
  return applyDecorators(
    ApiOperation({ summary: 'Send OTP for login or signup' }),
    ApiBody({
      type: SendOtpDto,
      examples: {
        'Valid Request': {
          value: {
            countryCode: '+91',
            phoneNumber: '9876543210',
            accountType: 'USER',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'OTP sent or resent successfully',
    }),
    ApiResponse({ status: 201, description: 'OTP sent successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({
      status: 429,
      description: 'Too Many Requests (Throttled or Limits Reached)',
    }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
