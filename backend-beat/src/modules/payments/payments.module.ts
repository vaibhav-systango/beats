import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { PaymentsAdminController } from './payments-admin.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import {
  IPaymentProvider,
  PAYMENT_PROVIDER,
} from './providers/payment-provider.interface';
import { RazorpayPaymentProvider } from './providers/razorpay/razorpay.provider';
import { StripePaymentProvider } from './providers/stripe/stripe.provider';
import { PaymentFulfillmentService } from './services/payment-fulfillment.service';
import { PaymentsService } from './services/payments.service';
import { InventoryService } from './services/inventory.service';
import { PayoutService } from './services/payout.service';
import { WalletService } from './services/wallet.service';

const providerAdapters: Record<
  string,
  (configService: ConfigService) => IPaymentProvider
> = {
  stripe: (configService) => new StripePaymentProvider(configService),
  razorpay: (configService) => new RazorpayPaymentProvider(configService),
};

const PaymentProviderFactory: Provider<IPaymentProvider> = {
  provide: PAYMENT_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): IPaymentProvider => {
    const provider = (
      configService.get<string>('payment.provider') ?? 'stripe'
    ).toLowerCase();
    const create = providerAdapters[provider];
    if (!create) {
      throw new Error(
        `Unsupported PAYMENT_PROVIDER: ${provider}. Register an adapter for this key.`,
      );
    }
    return create(configService);
  },
};

@Module({
  imports: [DatabaseModule],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaymentsAdminController,
  ],
  providers: [
    PaymentsService,
    PaymentProviderFactory,
    InventoryService,
    WalletService,
    PayoutService,
    PaymentFulfillmentService,
  ],
})
export class PaymentsModule {}
