import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntryType } from '../../../common/enums';
import { MONEY_COLUMN } from '../../../common/money';
import { LedgerAccount } from './ledger-account.entity';
import { LedgerTransaction } from './ledger-transaction.entity';

/**
 * Signed amount convention: DEBIT is positive, CREDIT is negative, so the
 * entries of a balanced transaction always sum to exactly zero. The sign/type
 * agreement is enforced by a CHECK; the zero-sum rule and append-only behaviour
 * are enforced by triggers (see migrations/1730000000000-LedgerIntegrity.ts).
 */
@Entity({ name: 'ledger_entries' })
@Check(
  'CHK_ledger_entries_sign_matches_type',
  `("entryType" = 'DEBIT' AND "amount" > 0) OR ("entryType" = 'CREDIT' AND "amount" < 0)`,
)
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  transactionId!: string;

  @ManyToOne(() => LedgerTransaction, (tx) => tx.entries, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: LedgerTransaction;

  @Index()
  @Column({ type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => LedgerAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account!: LedgerAccount;

  /** Decimal string: positive for DEBIT, negative for CREDIT. */
  @Column(MONEY_COLUMN)
  amount!: string;

  @Column({ type: 'enum', enum: EntryType, enumName: 'ledger_entry_type' })
  entryType!: EntryType;
}
