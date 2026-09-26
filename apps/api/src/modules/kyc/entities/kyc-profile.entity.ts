import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KycStatus } from '../../../common/enums';
import { User } from '../../identity/entities/user.entity';

@Entity({ name: 'kyc_profiles' })
export class KycProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** One KYC profile per user. */
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 64 })
  nationalIdOrPassport!: string;

  @Column({ type: 'varchar', length: 2048 })
  documentUrl!: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    enumName: 'kyc_status',
    default: KycStatus.NOT_STARTED,
  })
  status!: KycStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
