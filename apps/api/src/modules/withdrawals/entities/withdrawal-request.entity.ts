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
  bankName: string;
  accountNumber: string;
  swiftBic: string;
  iban?: string;
  accountName: string;
  country?: string;
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

  /** Total requested from the campaign wallet. Decimal string. */
  @Column(MONEY_COLUMN)
  grossAmount!: string;

  /** 8% platform revenue, computed server-side. */
  @Column(MONEY_COLUMN)
  serviceFee!: string;

  /** grossAmount - serviceFee: the amount actually wired to the bank. */
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

  /** Bank's reference for the executed payout; also proves the payout happened. */
  @Column({ type: 'varchar', length: 128, nullable: true })
  payoutReference!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
