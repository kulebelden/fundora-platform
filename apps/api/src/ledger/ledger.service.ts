import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EntryType, LedgerAccountType, TransactionStatus } from '../common/enums';
import { LedgerAccount } from '../modules/ledger/entities/ledger-account.entity';
import { LedgerEntry } from '../modules/ledger/entities/ledger-entry.entity';
import { LedgerTransaction } from '../modules/ledger/entities/ledger-transaction.entity';
import { PaymentIntent } from '../modules/payments/entities/payment-intent.entity';
import { ProcessedWebhook } from '../modules/payments/entities/processed-webhook.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { WithdrawalRequest } from '../modules/withdrawals/entities/withdrawal-request.entity';
import {
  CARD_PROCESSING_FEE_RATE,
  PLATFORM_FEE_RATE,
} from './fees';

function roundMinor(value: number): number {
  return Math.round(value * 100) / 100;
}

interface PostDonationLedgerOptions {
  providerEventId?: string;
  providerName?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(PaymentIntent)
    private readonly paymentIntents: Repository<PaymentIntent>,
  ) {}

  async postDonationLedger(
    paymentIntentId: string,
    transactionManager: EntityManager,
    options: PostDonationLedgerOptions = {},
  ): Promise<LedgerTransaction> {
    const paymentIntent = await transactionManager
      .getRepository(PaymentIntent)
      .createQueryBuilder('paymentIntent')
      .leftJoinAndSelect('paymentIntent.campaign', 'campaign')
      .leftJoinAndSelect('campaign.wallet', 'wallet')
      .where('paymentIntent.id = :id', { id: paymentIntentId })
      .setLock('pessimistic_write')
      .getOne();

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (paymentIntent.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestException(
        `Payment intent status is ${paymentIntent.status}, expected ${TransactionStatus.SUCCESS}`,
      );
    }

    const grossAmount = Number(paymentIntent.amount);
    const platformFee = roundMinor(grossAmount * PLATFORM_FEE_RATE);
    const processingFee = roundMinor(
      paymentIntent.channel === 'BANK_TRANSFER' ? 0 : grossAmount * CARD_PROCESSING_FEE_RATE,
    );
    const netAmount = roundMinor(grossAmount - platformFee - processingFee);

    if (netAmount <= 0) {
      throw new BadRequestException('Computed campaign net amount must be positive');
    }

    const currency = paymentIntent.currency;
    const campaign = paymentIntent.campaign;
    const wallet = campaign?.wallet;

    if (!wallet) {
      throw new NotFoundException('Campaign wallet not found');
    }

    const accounts = await this.identifyAccounts(
      transactionManager,
      currency,
      campaign.id,
    );

    const transaction = await transactionManager
      .getRepository(LedgerTransaction)
      .save(
        transactionManager.getRepository(LedgerTransaction).create({
          referenceId: paymentIntent.providerReference ?? paymentIntent.id,
          description: `Donation ledger posting for campaign ${campaign.id}`,
          status: TransactionStatus.SUCCESS,
        }),
      );

    const debitSum = grossAmount;
    const creditSum = -(netAmount + platformFee);
    const total = roundMinor(debitSum + creditSum + processingFee);

    if (total !== 0) {
      throw new BadRequestException(
        `Ledger posting is unbalanced (sum = ${total})`,
      );
    }

    const entries = [
      this.entry(transaction.id, accounts.bankClearing, grossAmount, EntryType.DEBIT),
      this.entry(transaction.id, accounts.campaignWallet, -netAmount, EntryType.CREDIT),
      this.entry(transaction.id, accounts.platformFeeRevenue, -platformFee, EntryType.CREDIT),
      this.entry(transaction.id, accounts.bankGatewayExpense, processingFee, EntryType.DEBIT),
    ];

    await transactionManager
      .getRepository(LedgerEntry)
      .createQueryBuilder()
      .insert()
      .into(LedgerEntry)
      .values(entries)
      .execute();

    await transactionManager
      .getRepository(CampaignWallet)
      .createQueryBuilder()
      .update(CampaignWallet)
      .set({
        clearedBalance: () =>
          `("clearedBalance" + ${netAmount})::numeric`,
      })
      .where('campaignId = :campaignId', { campaignId: campaign.id })
      .execute();

    if (options.providerEventId) {
      await transactionManager.query(
        `INSERT INTO "processed_webhooks" ("providerEventId", "providerName", "payload")
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [
          options.providerEventId,
          options.providerName ?? '',
          options.payload ?? {},
        ],
      );
    }

    return transaction;
  }

  /**
   * Posts the balanced ledger transaction for an executed withdrawal payout:
   *   DEBIT  2010-CAMPAIGN-WALLET-{campaignId}  gross
   *   CREDIT 4020-PLATFORM-WITHDRAWAL-FEE       fee
   *   CREDIT 1010-BANK-CLEARING-{currency}      net
   * Must run inside the caller's DB transaction (the balance trigger checks at COMMIT).
   */
  async postWithdrawalLedger(
    withdrawal: WithdrawalRequest,
    transactionManager: EntityManager,
  ): Promise<LedgerTransaction> {
    const gross = Number(withdrawal.grossAmount);
    const fee = Number(withdrawal.serviceFee);
    const net = Number(withdrawal.netAmount);

    if (roundMinor(gross - fee - net) !== 0 || fee < 0 || net <= 0) {
      throw new BadRequestException('Withdrawal amounts are inconsistent; refusing to post ledger');
    }

    const campaignWallet = await this.ensureAccount(transactionManager, {
      code: `2010-CAMPAIGN-WALLET-${withdrawal.campaignId}`,
      name: 'Campaign Wallet Liability',
      type: LedgerAccountType.LIABILITY,
      currency: withdrawal.currency,
    });
    const withdrawalFeeRevenue = await this.ensureAccount(transactionManager, {
      code: '4020-PLATFORM-WITHDRAWAL-FEE',
      name: 'Platform Withdrawal Fee Revenue',
      type: LedgerAccountType.REVENUE,
      currency: withdrawal.currency,
    });
    const bankClearing = await this.ensureAccount(transactionManager, {
      code: `1010-BANK-CLEARING-${withdrawal.currency}`,
      name: 'Bank Clearing Account',
      type: LedgerAccountType.ASSET,
      currency: withdrawal.currency,
    });

    const transaction = await transactionManager.getRepository(LedgerTransaction).save(
      transactionManager.getRepository(LedgerTransaction).create({
        referenceId: `withdrawal:${withdrawal.id}`,
        description: `Withdrawal payout for campaign ${withdrawal.campaignId}`,
        status: TransactionStatus.SUCCESS,
      }),
    );

    const entries = [
      this.entry(transaction.id, campaignWallet, gross, EntryType.DEBIT),
      this.entry(transaction.id, withdrawalFeeRevenue, -fee, EntryType.CREDIT),
      this.entry(transaction.id, bankClearing, -net, EntryType.CREDIT),
    ].filter((entry) => Number(entry.amount) !== 0);

    await transactionManager
      .getRepository(LedgerEntry)
      .createQueryBuilder()
      .insert()
      .into(LedgerEntry)
      .values(entries)
      .execute();

    return transaction;
  }

  private async ensureAccount(
    manager: EntityManager,
    spec: { code: string; name: string; type: LedgerAccountType; currency: string },
  ): Promise<LedgerAccount> {
    const repo = manager.getRepository(LedgerAccount);
    await repo.createQueryBuilder().insert().values(spec).orIgnore().execute();
    return repo.findOneByOrFail({ code: spec.code });
  }

  private async identifyAccounts(
    manager: EntityManager,
    currency: string,
    campaignId: string,
  ): Promise<{
    bankClearing: LedgerAccount;
    campaignWallet: LedgerAccount;
    platformFeeRevenue: LedgerAccount;
    bankGatewayExpense: LedgerAccount;
  }> {
    const accountsRepo = manager.getRepository(LedgerAccount);

    const codes = [
      `1010-BANK-CLEARING-${currency}`,
      `2010-CAMPAIGN-WALLET-${campaignId}`,
      `4010-PLATFORM-FEE-REVENUE-${currency}`,
      `5010-BANK-GATEWAY-EXPENSE-${currency}`,
    ];

    const existing = await accountsRepo.find({
      where: { code: In(codes) },
      lock: { mode: 'pessimistic_write' },
    });

    const accountsByCode = new Map(existing.map((account) => [account.code, account]));

    const specs: Array<{
      code: string;
      name: string;
      type: LedgerAccountType;
    }> = [
      {
        code: `1010-BANK-CLEARING-${currency}`,
        name: 'Bank Clearing Account',
        type: LedgerAccountType.ASSET,
      },
      {
        code: `2010-CAMPAIGN-WALLET-${campaignId}`,
        name: 'Campaign Wallet Liability',
        type: LedgerAccountType.LIABILITY,
      },
      {
        code: `4010-PLATFORM-FEE-REVENUE-${currency}`,
        name: 'Platform Fee Revenue',
        type: LedgerAccountType.REVENUE,
      },
      {
        code: `5010-BANK-GATEWAY-EXPENSE-${currency}`,
        name: 'Bank Gateway Expense',
        type: LedgerAccountType.EXPENSE,
      },
    ];

    const accounts: Array<{
      code: string;
      name: string;
      type: LedgerAccountType;
    }> = specs.filter((spec) => !accountsByCode.has(spec.code));

    for (const spec of accounts) {
      accountsByCode.set(
        spec.code,
        accountsRepo.create({
          code: spec.code,
          name: spec.name,
          type: spec.type,
          currency,
        }),
      );
    }

    if (accounts.length) {
      await accountsRepo.save(Array.from(accountsByCode.values()).filter((account) => !account.id));
    }

    return {
      bankClearing: accountsByCode.get(`1010-BANK-CLEARING-${currency}`)!,
      campaignWallet: accountsByCode.get(`2010-CAMPAIGN-WALLET-${campaignId}`)!,
      platformFeeRevenue: accountsByCode.get(`4010-PLATFORM-FEE-REVENUE-${currency}`)!,
      bankGatewayExpense: accountsByCode.get(`5010-BANK-GATEWAY-EXPENSE-${currency}`)!,
    };
  }

  private entry(
    transactionId: string,
    account: LedgerAccount,
    amount: number,
    entryType: EntryType,
  ) {
    return {
      transactionId,
      accountId: account.id,
      amount: amount.toFixed(4),
      entryType,
    };
  }
}
