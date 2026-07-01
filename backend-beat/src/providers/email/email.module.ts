import { Module, Provider, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';
import { DevMailProvider } from './providers/devmail.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { IEmailProvider } from './providers/email-provider.interface';

const EmailProviderFactory: Provider<IEmailProvider> = {
  provide: 'EMAIL_PROVIDER',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const provider =
      configService.get<string>('EMAIL_PROVIDER') ||
      process.env.EMAIL_PROVIDER ||
      'devmail';

    switch (provider.toLowerCase()) {
      case 'sendgrid':
        return new SendGridProvider(configService);

      case 'devmail':
      default:
        return new DevMailProvider();
    }
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailProviderFactory],
  exports: [EmailService],
})
export class EmailModule {}
