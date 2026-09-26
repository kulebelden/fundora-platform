import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MONEY_COLUMN } from '../../../common/money';
import { Campaign } from './campaign.entity';

/**
 * Read-model of a campaign's balances. The ledger is the source of truth;
 * these columns must only be mutated in the same DB transaction as a ledger posting.
 */
@Entity({ name: 'campaign_wallets' })
@Check('CHK_campaign_wallets_cleared_non_negative', '"clearedBalance" >= 0')
@Check('CHK_campaign_wallets_pending_non_negative', '"pendingBalance" >= 0')
export class CampaignWallet {
  @PrimaryColumn({ type: 'uuid' })
  campaignId!: string;

  @OneToOne(() => Campaign, (campaign) => campaign.wallet, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'campaignId' })
  campaign!: Campaign;

  @Column({ ...MONEY_COLUMN, default: '0' })
  clearedBalance!: string;

  @Column({ ...MONEY_COLUMN, default: '0' })
  pendingBalance!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
