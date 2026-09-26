import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { KycStatus, WithdrawalStatus } from '../common/enums';
import { calculateWithdrawalAmounts } from '../ledger/fees';
import { LedgerService } from '../ledger/ledger.service';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { KycProfile } from '../modules/kyc/entities/kyc-profile.entity';
import { WithdrawalRequest } from '../modules/withdrawals/entities/withdrawal-request.entity';
import { BANK_PAYOUT_ADAPTER, IBankPayoutAdapter } from './adapters/bank-payout.adapter';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly ledger: LedgerService,
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawals: Repository<WithdrawalRequest>,
    @InjectRepository(KycProfile)
    private readonly kycProfiles: Repository<KycProfile>,
    @InjectRepository(Campaign)
    private readonly campaigns: Repository<Campaign>,
    @InjectRepository(CampaignWallet)
    private readonly wallets: Repository<CampaignWallet>,
    @Inject(BANK_PAYOUT_ADAPTER)
    private readonly bankPayout: IBankPayoutAdapter,
  ) {}

  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto): Promise<WithdrawalRequest> {
    const kyc = await this.kycProfiles.findOne({ where: { userId } });
    if (kyc?.status !== KycStatus.VERIFIED) {
      throw new ForbiddenException('KYC verification is required before requesting a withdrawal');
    }

    const campaign = await this.campaigns.findOne({ where: { id: dto.campaignId } });
    if (!campaign || campaign.creatorId !== userId) {
      // Same response for "missing" and "not yours" so campaign ids can't be probed.
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.currency !== dto.currency) {
      throw new BadRequestException(`Withdrawal currency must match campaign currency ${campaign.currency}`);
    }

    const wallet = await this.wallets.findOne({ where: { campaignId: campaign.id } });
    if (!wallet) {
      throw new NotFoundException('Campaign wallet not found');
    }

    const amounts = calculateWithdrawalAmounts(dto.amount);
    if (Number(amounts.net) <= 0) {
      throw new BadRequestException('Withdrawal amount is too small');
    }
    if (Number(wallet.clearedBalance) < Number(amounts.gross)) {
      throw new BadRequestException('Insufficient cleared balance');
    }

    return this.dataSource.transaction(async (manager) => {
      // Conditional update makes the balance check atomic against concurrent requests.
      const moved = await manager
        .createQueryBuilder()
        .update(CampaignWallet)
        .set({
          clearedBalance: () => 'CAST("clearedBalance" - :gross AS numeric)',
          pendingBalance: () => 'CAST("pendingBalance" + :gross AS numeric)',
        })
        .where('"campaignId" = :campaignId AND "clearedBalance" >= :gross', {
          campaignId: campaign.id,
          gross: amounts.gross,
        })
        .execute();

      if (!moved.affected) {
        throw new BadRequestException('Insufficient cleared balance');
      }

      const repo = manager.getRepository(WithdrawalRequest);
      return repo.save(
        repo.create({
          campaignId: campaign.id,
          userId,
          grossAmount: amounts.gross,
          serviceFee: amounts.fee,
          netAmount: amounts.net,
          currency: campaign.currency,
          bankAccountDetails: { ...dto.bankDetails },
          status: WithdrawalStatus.PENDING_REVIEW,
        }),
      );
    });
  }

  async reviewWithdrawal(
    withdrawalId: string,
    reviewerId: string,
    dto: ReviewWithdrawalDto,
  ): Promise<WithdrawalRequest> {
    const reviewed = await this.dataSource.transaction(async (manager) => {
      const withdrawal = await this.lockWithdrawal(manager, withdrawalId);

      if (withdrawal.status !== WithdrawalStatus.PENDING_REVIEW) {
        throw new BadRequestException(`Withdrawal is ${withdrawal.status}, not ${WithdrawalStatus.PENDING_REVIEW}`);
      }
      if (withdrawal.userId === reviewerId) {
        throw new ForbiddenException('You cannot review your own withdrawal');
      }

      withdrawal.reviewedBy = reviewerId;
      withdrawal.reviewedAt = new Date();

      if (dto.status === WithdrawalStatus.REJECTED) {
        const returned = await manager
          .createQueryBuilder()
          .update(CampaignWallet)
          .set({
            pendingBalance: () => 'CAST("pendingBalance" - :gross AS numeric)',
            clearedBalance: () => 'CAST("clearedBalance" + :gross AS numeric)',
          })
          .where('"campaignId" = :campaignId AND "pendingBalance" >= :gross', {
            campaignId: withdrawal.campaignId,
            gross: withdrawal.grossAmount,
          })
          .execute();

        if (!returned.affected) {
          throw new InternalServerErrorException('Wallet pending balance is inconsistent');
        }

        withdrawal.status = WithdrawalStatus.REJECTED;
        withdrawal.rejectionReason = dto.reason ?? null;
      } else {
        withdrawal.status = WithdrawalStatus.APPROVED;
      }

      return manager.getRepository(WithdrawalRequest).save(withdrawal);
    });

    if (reviewed.status !== WithdrawalStatus.APPROVED) {
      return reviewed;
    }

    // Approval is durable even if the payout fails; completePayout is safe to retry.
    try {
      return await this.completePayout(reviewed.id);
    } catch (error) {
      this.logger.error(
        `Payout failed for withdrawal ${reviewed.id}; it remains awaiting payout`,
        error instanceof Error ? error.stack : String(error),
      );
      return this.withdrawals.findOneByOrFail({ id: reviewed.id });
    }
  }

  /**
   * Executes the bank payout for the net amount, then books the ledger and settles the wallet.
   * Retry-safe: the bank call is keyed by the withdrawal id, and settlement is a single DB transaction.
   */
  async completePayout(withdrawalId: string): Promise<WithdrawalRequest> {
    // Phase 1: claim the withdrawal so concurrent callers can't both pay it out.
    const claimed = await this.dataSource.transaction(async (manager) => {
      const withdrawal = await this.lockWithdrawal(manager, withdrawalId);

      if (withdrawal.status === WithdrawalStatus.COMPLETED) {
        return withdrawal;
      }
      if (
        withdrawal.status !== WithdrawalStatus.APPROVED &&
        withdrawal.status !== WithdrawalStatus.PROCESSING
      ) {
        throw new BadRequestException(`Withdrawal is ${withdrawal.status} and cannot be paid out`);
      }

      withdrawal.status = WithdrawalStatus.PROCESSING;
      return manager.getRepository(WithdrawalRequest).save(withdrawal);
    });

    if (claimed.status === WithdrawalStatus.COMPLETED) {
      return claimed;
    }

    // Phase 2: move the money. Outside a DB transaction so a slow bank never holds row locks.
    // A failure here leaves the withdrawal PROCESSING, which may already have paid: retry uses the same key.
    const payout = await this.bankPayout.executePayout({
      idempotencyKey: claimed.id,
      amount: claimed.netAmount,
      currency: claimed.currency,
      destination: claimed.bankAccountDetails,
    });

    // Phase 3: settle atomically: ledger + wallet + status commit together or not at all.
    return this.dataSource.transaction(async (manager) => {
      const withdrawal = await this.lockWithdrawal(manager, withdrawalId);

      if (withdrawal.status === WithdrawalStatus.COMPLETED) {
        return withdrawal;
      }
      if (withdrawal.status !== WithdrawalStatus.PROCESSING) {
        throw new BadRequestException(`Withdrawal is ${withdrawal.status}, expected ${WithdrawalStatus.PROCESSING}`);
      }

      await this.ledger.postWithdrawalLedger(withdrawal, manager);

      const settled = await manager
        .createQueryBuilder()
        .update(CampaignWallet)
        .set({ pendingBalance: () => 'CAST("pendingBalance" - :gross AS numeric)' })
        .where('"campaignId" = :campaignId AND "pendingBalance" >= :gross', {
          campaignId: withdrawal.campaignId,
          gross: withdrawal.grossAmount,
        })
        .execute();

      if (!settled.affected) {
        throw new InternalServerErrorException('Wallet pending balance is inconsistent');
      }

      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.payoutReference = payout.reference;
      return manager.getRepository(WithdrawalRequest).save(withdrawal);
    });
  }

  findMine(userId: string): Promise<WithdrawalRequest[]> {
    return this.withdrawals.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findPending(): Promise<WithdrawalRequest[]> {
    return this.withdrawals.find({
      where: { status: WithdrawalStatus.PENDING_REVIEW },
      order: { createdAt: 'ASC' },
    });
  }

  private async lockWithdrawal(manager: EntityManager, id: string): Promise<WithdrawalRequest> {
    const withdrawal = await manager.getRepository(WithdrawalRequest).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }
    return withdrawal;
  }
}
