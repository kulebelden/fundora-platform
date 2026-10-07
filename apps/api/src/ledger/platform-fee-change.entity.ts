import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../modules/identity/entities/user.entity';

/**
 * One change to the platform fee. The newest row is the fee in force; the
 * table is append-only, so it is also the fee's audit trail.
 */
@Entity({ name: 'platform_fee_changes' })
export class PlatformFeeChange {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Fraction of each donation, e.g. "0.0500" for 5%. */
  @Column({ type: 'numeric', precision: 6, scale: 4 })
  rate!: string;

  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true })
  previousRate!: string | null;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({ type: 'uuid', nullable: true })
  changedById!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy?: User | null;

  @Index('IDX_platform_fee_changes_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
