import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionStatus } from '../../../common/enums';
import { LedgerEntry } from './ledger-entry.entity';

@Entity({ name: 'ledger_transactions' })
export class LedgerTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Idempotency key for the posting (e.g. provider event id). Unique. */
  @Column({ type: 'varchar', length: 128, unique: true })
  referenceId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    enumName: 'transaction_status',
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction)
  entries?: LedgerEntry[];
}
