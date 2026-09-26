import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LedgerService } from '../ledger/ledger.service';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { LedgerAccount } from '../modules/ledger/entities/ledger-account.entity';
import { LedgerEntry } from '../modules/ledger/entities/ledger-entry.entity';
import { LedgerTransaction } from '../modules/ledger/entities/ledger-transaction.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ProcessedWebhook } from '../modules/payments/entities/processed-webhook.entity';
import { BankWirePaymentAdapter } from './adapters/bank-wire.adapter';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Campaign,
      CampaignWallet,
      LedgerAccount,
      LedgerEntry,
      LedgerTransaction,
      PaymentIntent,
      ProcessedWebhook,
    ]),
  ],
  controllers: [PaymentsController, WebhooksController],
  providers: [
    StripePaymentAdapter,
    BankWirePaymentAdapter,
    PaymentsService,
    LedgerService,
  ],
  exports: [PaymentsService, LedgerService],
})
export class PaymentsModule {}
