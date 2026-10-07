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
  ValidateNested,
} from 'class-validator';
import { SUPPORTED_CURRENCIES, isSupportedCountry } from '../../common/supported-markets';

/** ISO 3166-1 alpha-2, and one of the markets HopeNest can pay out to. */
function IsSupportedCountryCode() {
  return ValidateBy({
    name: 'isSupportedCountryCode',
    validator: {
      validate: (value: unknown) => isSupportedCountry(value),
      defaultMessage: () => 'country is not a supported payout market',
    },
  });
}

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

  /** Optional: not every banking system (e.g. the US) uses IBANs. */
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountName!: string;

  /** ISO 3166-1 alpha-2, restricted to the supported payout markets. */
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @IsSupportedCountryCode()
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
  @IsIn(SUPPORTED_CURRENCIES, {
    message: `currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  currency!: string;

  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails!: BankDetailsDto;
}
