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
} from 'typeorm';
import { MONEY_COLUMN } from '../../../common/money';
import { User } from '../../identity/entities/user.entity';
import { PaymentIntent } from './payment-intent.entity';

/**
 * A staff member's statement that a bank transfer arrived. Append-only (a database
 * trigger refuses updates and deletes), and each bank reference can be used once.
 */
@Entity({ name: 'bank_transfer_confirmations' })
@Check('CHK_bank_transfer_confirmations_amount_positive', '"amountReceived" > 0')
export class BankTransferConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('UQ_bank_transfer_confirmations_payment_intent', { unique: true })
  @Column({ type: 'uuid' })
  paymentIntentId!: string;

  @OneToOne(() => PaymentIntent, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paymentIntentId' })
  paymentIntent!: PaymentIntent;

  /** As printed on the bank statement, upper-cased with spaces removed. */
  @Index('UQ_bank_transfer_confirmations_bank_reference', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  bankReference!: string;

  @Column(MONEY_COLUMN)
  amountReceived!: string;

  @Column({ type: 'char', length: 3 })
  currency!: string;

  @Column({ type: 'date' })
  receivedOn!: string;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid' })
  confirmedBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'confirmedBy' })
  confirmer!: User;

  /** Kept as written at the time, so the record still reads if the account changes. */
  @Column({ type: 'varchar', length: 255 })
  confirmedByEmail!: string;

  @Index('IDX_bank_transfer_confirmations_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
