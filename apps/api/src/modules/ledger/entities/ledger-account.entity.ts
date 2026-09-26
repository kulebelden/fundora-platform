import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LedgerAccountType } from '../../../common/enums';

@Entity({ name: 'ledger_accounts' })
export class LedgerAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: LedgerAccountType, enumName: 'ledger_account_type' })
  type!: LedgerAccountType;

  @Column({ type: 'char', length: 3 })
  currency!: string;
}
