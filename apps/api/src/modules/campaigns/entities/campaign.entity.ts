import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CampaignStatus } from '../../../common/enums';
import { MONEY_COLUMN } from '../../../common/money';
import { User } from '../../identity/entities/user.entity';
import { CampaignCategory } from './campaign-category.entity';
import { CampaignWallet } from './campaign-wallet.entity';

@Entity({ name: 'campaigns' })
@Check('CHK_campaigns_target_positive', '"targetAmount" > 0')
@Check('CHK_campaigns_dates_ordered', '"endDate" IS NULL OR "startDate" IS NULL OR "endDate" > "startDate"')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  creatorId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creatorId' })
  creator!: User;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CampaignCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category!: CampaignCategory;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  story!: string;

  /** Absolute https URL of the campaign's cover image. */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  coverImageUrl!: string | null;

  /** Decimal string; never a JS number. */
  @Column(MONEY_COLUMN)
  targetAmount!: string;

  /** ISO 4217 */
  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Index()
  @Column({ type: 'enum', enum: CampaignStatus, enumName: 'campaign_status', default: CampaignStatus.DRAFT })
  status!: CampaignStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => CampaignWallet, (wallet) => wallet.campaign)
  wallet?: CampaignWallet;
}
