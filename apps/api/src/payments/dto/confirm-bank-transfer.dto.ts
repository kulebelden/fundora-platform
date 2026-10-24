import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ConfirmBankTransferDto {
  /** As printed on the bank statement. Stored upper-cased with spaces removed. */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @IsString()
  @Matches(/^[A-Z0-9/\-_.]{4,64}$/, {
    message: 'Bank reference must be 4-64 letters, digits or / - _ .',
  })
  bankReference!: string;

  /** Must equal the pledged amount exactly; anything else needs finance to follow up. */
  @IsString()
  @Matches(/^\d{1,16}(\.\d{1,4})?$/, { message: 'Enter the amount received, for example 250.00' })
  amountReceived!: string;

  /** The value date on the bank statement (YYYY-MM-DD). */
  @IsDateString({ strict: true })
  receivedOn!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Re-entered by the staff member: a hijacked session alone cannot credit money. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class BankTransfersQueryDto {
  @IsOptional()
  @IsIn(['pending', 'confirmed'])
  status?: 'pending' | 'confirmed';
}
