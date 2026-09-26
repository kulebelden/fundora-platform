import { CampaignCategory } from '../modules/campaigns/entities/campaign-category.entity';
import { CampaignUpdate } from '../modules/campaigns/entities/campaign-update.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { UserProfile } from '../modules/identity/entities/user-profile.entity';
import { User } from '../modules/identity/entities/user.entity';
import { LedgerAccount } from '../modules/ledger/entities/ledger-account.entity';
import { LedgerEntry } from '../modules/ledger/entities/ledger-entry.entity';
import { LedgerTransaction } from '../modules/ledger/entities/ledger-transaction.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ProcessedWebhook } from '../modules/payments/entities/processed-webhook.entity';
import { RefreshToken } from '../auth/refresh-token.entity';
import { KycProfile } from '../modules/kyc/entities/kyc-profile.entity';
import { WithdrawalRequest } from '../modules/withdrawals/entities/withdrawal-request.entity';
import { ContactMessage } from '../modules/contact/entities/contact-message.entity';

export const ENTITIES = [
  User,
  UserProfile,
  RefreshToken,
  CampaignCategory,
  Campaign,
  CampaignUpdate,
  CampaignWallet,
  LedgerAccount,
  LedgerTransaction,
  LedgerEntry,
  PaymentIntent,
  ProcessedWebhook,
  KycProfile,
  WithdrawalRequest,
  ContactMessage,
];
