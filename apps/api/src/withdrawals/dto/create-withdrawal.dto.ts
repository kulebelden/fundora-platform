import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateBy,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SUPPORTED_CURRENCIES, isSupportedCountry } from '../../common/supported-markets';

function IsSupportedCountryCode() {
  return ValidateBy({
    name: 'isSupportedCountryCode',
    validator: {
      validate: (value: unknown) => isSupportedCountry(value),
      defaultMessage: () => 'country is not a supported payout market',
    },
  });
}

/** ABA routing number: 9 digits whose weighted sum (3, 7, 1 repeating) is a multiple of 10. */
export function isAbaRoutingNumber(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{9}$/.test(value)) return false;
  const d = value.split('').map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

function IsAbaRoutingNumber() {
  return ValidateBy({
    name: 'isAbaRoutingNumber',
    validator: {
      validate: isAbaRoutingNumber,
      defaultMessage: (args) => `${args?.property} must be a valid 9-digit US routing number`,
    },
  });
}

export const PAYOUT_METHODS = ['us_bank', 'international'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export const US_ACCOUNT_TYPES = ['checking', 'savings'] as const;

const isUsBank = (details: BankDetailsDto) => details.method === 'us_bank';

export class BankDetailsDto {
  /** us_bank pays by ACH or wire inside the US; international pays by SWIFT. */
  @IsOptional()
  @IsIn(PAYOUT_METHODS)
  method?: PayoutMethod = 'international';

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  accountNumber!: string;

  @ValidateIf((details: BankDetailsDto) => !isUsBank(details))
  @IsString()
  @IsNotEmpty()
  @MaxLength(11)
  swiftBic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @IsSupportedCountryCode()
  country?: string;

  /* US bank (ACH / wire) fields, required when method is us_bank. */

  @ValidateIf(isUsBank)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountHolder?: string;

  @ValidateIf(isUsBank)
  @IsIn(US_ACCOUNT_TYPES)
  accountType?: (typeof US_ACCOUNT_TYPES)[number];

  @ValidateIf(isUsBank)
  @IsAbaRoutingNumber()
  achRouting?: string;

  @ValidateIf(isUsBank)
  @IsAbaRoutingNumber()
  wireRouting?: string;

  @ValidateIf(isUsBank)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  bankAddress?: string;
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
  @IsIn(SUPPORTED_CURRENCIES, {
    message: `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  currency!: string;

  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails!: BankDetailsDto;
}
