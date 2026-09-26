import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export type DonationProvider = 'stripe' | 'bank_wire';

export class CreateDonationDto {
  @IsUUID()
  campaignId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  /* Donor details as typed in the form. Optional for signed-in donors. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  donorName?: string;

  @IsOptional()
  @Transform(trim)
  @IsEmail()
  @MaxLength(255)
  donorEmail?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9 ()-]{7,20}$/, { message: 'donorPhone must be a valid phone number' })
  donorPhone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  donorMessage?: string;

  @IsOptional()
  @IsEnum(['stripe', 'bank_wire'])
  @IsString()
  provider?: DonationProvider = 'stripe';
}
