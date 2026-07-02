import { Injectable } from '@nestjs/common';
import { IEmailProvider } from './email-provider.interface';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  constructor(
    private configService: ConfigService,
    private logger = new Logger(SendGridProvider.name),
  ) {
    const apiKey =
      this.configService.get<string>('SENDGRID_API_KEY') ||
      this.configService.get<string>('sendGrid.apiKey') ||
      process.env.SENDGRID_API_KEY ||
      'test_key';
    sgMail.setApiKey(apiKey);
    this.logger.log(`SendGridProvider initialized (API key length: ${apiKey.length})`);
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      const from =
        this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
        this.configService.get<string>('sendGrid.from') ||
        process.env.SENDGRID_FROM_EMAIL ||
        'no-reply@beats-events.com';
      await sgMail.send({
        to,
        from,
        subject,
        text,
        html,
      });
      this.logger.log(`[SENDGRID] Email sent to ${to}, from ${from}`);
    } catch (error) {
      this.logger.error(
        `[SENDGRID] Failed to send email to ${to} | Error: ${JSON.stringify(error)}`,
      );
    }
  }
}
