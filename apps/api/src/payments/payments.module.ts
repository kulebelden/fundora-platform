import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { LedgerService } from '../ledger/ledger.service';
import { PlatformFeeChange } from '../ledger/platform-fee-change.entity';
import { PlatformFeeService } from '../ledger/platform-fee.service';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { LedgerAccount } from '../modules/ledger/entities/ledger-account.entity';
import { LedgerEntry } from '../modules/ledger/entities/ledger-entry.entity';
import { LedgerTransaction } from '../modules/ledger/entities/ledger-transaction.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ProcessedWebhook } from '../modules/payments/entities/processed-webhook.entity';
import { BankTransferConfirmation } from '../modules/payments/entities/bank-transfer-confirmation.entity';
import { BankWirePaymentAdapter } from './adapters/bank-wire.adapter';
import { PayPalPaymentAdapter } from './adapters/paypal-payment.adapter';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { BankTransfersController } from './bank-transfers.controller';
import { BankTransfersService } from './bank-transfers.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    AuthModule,
    MailModule,
    TypeOrmModule.forFeature([
      Campaign,
      CampaignWallet,
      LedgerAccount,
      LedgerEntry,
      LedgerTransaction,
      PaymentIntent,
      ProcessedWebhook,
      BankTransferConfirmation,
      PlatformFeeChange,
    ]),
  ],
  controllers: [PaymentsController, WebhooksController, BankTransfersController],
  providers: [
    StripePaymentAdapter,
    BankWirePaymentAdapter,
    PayPalPaymentAdapter,
    PaymentsService,
    BankTransfersService,
    LedgerService,
    PlatformFeeService,
  ],
  exports: [PaymentsService, LedgerService, PlatformFeeService],
})
export class PaymentsModule {}
