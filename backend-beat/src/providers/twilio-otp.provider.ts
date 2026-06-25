import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Twilio } from 'twilio';
import { AuthMessages } from '../modules/auth/constants/auth.constants';

@Injectable()
export class TwilioOtpProvider {
  private readonly logger = new Logger(TwilioOtpProvider.name);
  private twilioClient: Twilio | null = null;

  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
  private readonly fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  constructor() {
    if (this.accountSid && this.authToken) {
      this.twilioClient = new Twilio(this.accountSid, this.authToken);
    } else {
      this.logger.warn(
        'Twilio credentials are not set in .env. OTPs will not be delivered.',
      );
    }
  }

  async sendSmsOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.logger.warn(
        `Twilio not configured. Simulated SMS OTP ${otp} to ${phoneNumber}`,
      );
      return;
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: `Your verification code is: ${otp}`,
        from: this.fromPhoneNumber,
        to: phoneNumber,
      });

      if (message.status === 'failed' || message.status === 'undelivered') {
        throw new Error(`Message status is ${message.status}`);
      }

      this.logger.log(`OTP SMS sent successfully to ${phoneNumber}`);
    } catch (error) {
      this.handleTwilioError(error);
    }
  }

  async sendVoiceOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.logger.warn(
        `Twilio not configured. Simulated Voice OTP ${otp} to ${phoneNumber}`,
      );
      return;
    }

    try {
      // Splitting OTP with spaces ensures the Voice synthesis reads it character by character
      const spokenOtp = otp.split('').join(' ');

      const call = await this.twilioClient.calls.create({
        // Added a 2-second pause and a loop to ensure the OTP is heard after the Twilio trial greeting
        twiml: `<Response><Pause length="2"/><Say loop="3">Your verification code is ${spokenOtp}. I repeat, ${spokenOtp}.</Say></Response>`,
        from: this.fromPhoneNumber,
        to: phoneNumber,
      });

      if (call.status === 'failed' || call.status === 'canceled') {
        throw new Error(`Call status is ${call.status}`);
      }

      this.logger.log(
        `OTP Voice Call initiated successfully to ${phoneNumber}`,
      );
    } catch (error) {
      this.handleTwilioError(error);
    }
  }

  private handleTwilioError(error: any): never {
    const code = error?.code;
    const message = error?.message || 'Unknown Twilio Error';

    this.logger.error(`Twilio Error: ${message} (Code: ${code})`);

    switch (code) {
      case 21608:
        throw new BadRequestException(AuthMessages.TWILIO_UNVERIFIED_NUMBER);
      case 21408:
        throw new BadRequestException(AuthMessages.TWILIO_GEO_PERMISSION);
      case 20429:
      case 21462:
      case 20005:
        throw new BadRequestException(AuthMessages.TWILIO_LIMIT_REACHED);
      case 21211:
        throw new BadRequestException(AuthMessages.TWILIO_INVALID_NUMBER);
      default:
        throw new InternalServerErrorException(
          AuthMessages.TWILIO_GENERIC_ERROR,
        );
    }
  }
}
