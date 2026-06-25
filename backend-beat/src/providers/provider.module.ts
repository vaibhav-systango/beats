import { Module, Global } from '@nestjs/common';
import { TwilioOtpProvider } from './twilio-otp.provider';

@Global()
@Module({
  providers: [TwilioOtpProvider],
  exports: [TwilioOtpProvider],
})
export class ProviderModule {}
