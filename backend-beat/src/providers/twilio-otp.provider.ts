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

  /** Simulation only when explicitly enabled outside production. */
  private shouldSimulate(): boolean {
    if (process.env.OTP_SIMULATE_ON_FAILURE !== 'true') return false;
    const env = process.env.NODE_ENV;
    return env === 'development' || env === 'local' || env === 'test';
  }

  private simulateDelivery(channel: 'SMS' | 'VOICE', phoneNumber: string) {
    this.logger.warn(
      `Simulated ${channel} OTP delivery to ${phoneNumber} (Twilio unavailable or failed)`,
    );
  }

  private assertCanSimulateOrThrow(error?: unknown): void {
    if (this.shouldSimulate()) return;
    if (error) {
      this.handleTwilioError(error);
    }
    throw new InternalServerErrorException(AuthMessages.TWILIO_GENERIC_ERROR);
  }

  async sendSmsOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.assertCanSimulateOrThrow();
      this.simulateDelivery('SMS', phoneNumber);
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
      if (this.shouldSimulate()) {
        this.logger.error(
          `Twilio SMS failed; falling back to simulation. ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.simulateDelivery('SMS', phoneNumber);
        return;
      }
      this.handleTwilioError(error);
    }
  }

  async sendVoiceOtp(phoneNumber: string, otp: string): Promise<void> {
    if (!this.twilioClient || !this.fromPhoneNumber) {
      this.assertCanSimulateOrThrow();
      this.simulateDelivery('VOICE', phoneNumber);
      return;
    }

    try {
      const call = await this.twilioClient.calls.create({
        twiml: this.buildVoiceOtpTwiml(otp),
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
      if (this.shouldSimulate()) {
        this.logger.error(
          `Twilio voice failed; falling back to simulation. ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        this.simulateDelivery('VOICE', phoneNumber);
        return;
      }
      this.handleTwilioError(error);
    }
  }

  /**
   * Trial accounts play a “press any key” disclaimer first. After that, speak
   * each OTP digit slowly so the code is audible.
   */
  private buildVoiceOtpTwiml(otp: string): string {
    const digits = otp.replace(/\D/g, '').split('');
    const digitSays = digits
      .map(
        (digit) =>
          `<Say voice="Polly.Joanna" language="en-US">${digit}</Say><Pause length="1"/>`,
      )
      .join('');

    return [
      '<Response>',
      // Give the callee time to answer and dismiss the Twilio trial prompt.
      '<Pause length="5"/>',
      '<Say voice="Polly.Joanna" language="en-US">This is Beats. Your one time password is.</Say>',
      '<Pause length="1"/>',
      digitSays,
      '<Say voice="Polly.Joanna" language="en-US">Again, your code is.</Say>',
      '<Pause length="1"/>',
      digitSays,
      '<Say voice="Polly.Joanna" language="en-US">Goodbye.</Say>',
      '</Response>',
    ].join('');
  }

  private handleTwilioError(error: unknown): never {
    const err = error as { code?: string | number; message?: string };
    const code = Number(err?.code);
    const message = err?.message || 'Unknown Twilio Error';

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
