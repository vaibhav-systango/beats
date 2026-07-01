import { Injectable } from '@nestjs/common';
import { IEmailProvider } from './email-provider.interface';
import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

@Injectable()
export class DevMailProvider implements IEmailProvider {
  constructor(private logger = new Logger(DevMailProvider.name)) {}
  private transporter = nodemailer.createTransport({
    host: process.env.DEVMAIL_HOST || 'localhost',
    port: Number(process.env.DEVMAIL_PORT || 1025),
    secure: false,
    tls: { rejectUnauthorized: false },
  });

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"Dev Mail" <no-reply@local.dev>',
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`[DEVMAIL] Email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `[DEVMAIL] Failed to send email to ${to} | Error: ${JSON.stringify(error)}`,
      );
    }
  }
}
