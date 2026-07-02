import { Inject, Injectable, Logger } from '@nestjs/common';
import { emailTemplates, EmailTemplate } from './email-template';
import type { IEmailProvider } from './email-template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject('EMAIL_PROVIDER')
    private readonly emailProvider: IEmailProvider,
  ) {}

  getEmailTemplate(
    eventName: keyof typeof emailTemplates,
    variables: Record<string, any> = {},
  ): EmailTemplate {
    const template = emailTemplates[eventName];

    if (!template) {
      throw new Error(`No email template found for event: ${String(eventName)}`);
    }

    const replacePlaceholders = (content?: string): string | undefined => {
      if (!content) return content;
      return Object.entries(variables).reduce((acc, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return acc.replace(regex, String(value));
      }, content);
    };

    return {
      subject: replacePlaceholders(template.subject) ?? '',
      text: replacePlaceholders(template.text) ?? '',
      html: replacePlaceholders(template.html),
    };
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    this.logger.log(
      `Sending email to ${to} using ${this.emailProvider.constructor.name}`,
    );
    return (this.emailProvider as IEmailProvider).sendEmail(to, subject, text, html);
  }
}
