import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BankDetailsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  swiftBic!: string;

  /** Optional: not every banking system (e.g. US, Uganda) uses IBANs. */
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountName!: string;

  /** ISO 3166-1 alpha-2 */
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class CreateWithdrawalDto {
  @IsUUID()
  campaignId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  currency!: string;

  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails!: BankDetailsDto;
}
