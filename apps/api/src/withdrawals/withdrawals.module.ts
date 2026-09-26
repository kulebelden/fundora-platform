import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { KycProfile } from '../modules/kyc/entities/kyc-profile.entity';
import { WithdrawalRequest } from '../modules/withdrawals/entities/withdrawal-request.entity';
import { PaymentsModule } from '../payments/payments.module';
import { BANK_PAYOUT_ADAPTER, SimulatedBankPayoutAdapter } from './adapters/bank-payout.adapter';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';

@Module({
  imports: [
    AuthModule,
    PaymentsModule, // exports LedgerService
    TypeOrmModule.forFeature([WithdrawalRequest, KycProfile, Campaign, CampaignWallet]),
  ],
  controllers: [WithdrawalsController],
  providers: [
    WithdrawalsService,
    { provide: BANK_PAYOUT_ADAPTER, useClass: SimulatedBankPayoutAdapter },
  ],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
