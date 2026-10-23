import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WithdrawalStatus } from '../../../common/enums';
import { MONEY_COLUMN } from '../../../common/money';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { User } from '../../identity/entities/user.entity';

export interface BankAccountDetails {
  /** Absent on requests made before US payouts existed; those are international. */
  method?: 'us_bank' | 'international';
  bankName: string;
  accountNumber: string;
  accountName: string;
  /* International (SWIFT) */
  swiftBic?: string;
  iban?: string;
  country?: string;
  /* US bank (ACH / wire) */
  accountHolder?: string;
  accountType?: 'checking' | 'savings';
  achRouting?: string;
  wireRouting?: string;
  bankAddress?: string;
}

@Entity({ name: 'withdrawal_requests' })
@Check('CHK_withdrawal_requests_gross_positive', '"grossAmount" > 0')
@Check('CHK_withdrawal_requests_amounts_balance', '"grossAmount" = "serviceFee" + "netAmount"')
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => Campaign, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'campaignId' })
  campaign!: Campaign;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column(MONEY_COLUMN)
  grossAmount!: string;

  @Column(MONEY_COLUMN)
  serviceFee!: string;

  @Column(MONEY_COLUMN)
  netAmount!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'jsonb' })
  bankAccountDetails!: BankAccountDetails;

  @Index()
  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    enumName: 'withdrawal_status',
    default: WithdrawalStatus.REQUESTED,
  })
  status!: WithdrawalStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  payoutReference!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
