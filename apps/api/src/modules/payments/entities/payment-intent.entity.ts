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
import { PaymentChannel, TransactionStatus } from '../../../common/enums';
import { MONEY_COLUMN } from '../../../common/money';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { User } from '../../identity/entities/user.entity';

@Entity({ name: 'payment_intents' })
@Check('CHK_payment_intents_amount_positive', '"amount" > 0')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => Campaign, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'campaignId' })
  campaign!: Campaign;

  /** Null for guest donors. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  donorId!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'donorId' })
  donor!: User | null;

  /** Set server-side when the intent is created; never copied from a webhook or client. */
  @Column(MONEY_COLUMN)
  amount!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentChannel, enumName: 'payment_channel' })
  channel!: PaymentChannel;

  @Index({ unique: true, where: '"providerReference" IS NOT NULL' })
  @Column({ type: 'varchar', length: 128, nullable: true })
  providerReference!: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'payment_intent_status',
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  /*
   * What the donor typed in the donation form. Visible to finance staff only;
   * `isAnonymous` hides the name from the public feed, not from auditors.
   * Card data is never collected: the processor handles it on its own page.
   */
  @Column({ type: 'varchar', length: 160, nullable: true })
  donorName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  donorEmail!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  donorPhone!: string | null;

  @Column({ type: 'text', nullable: true })
  donorMessage!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
