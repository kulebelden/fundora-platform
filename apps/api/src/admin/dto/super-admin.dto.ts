import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdatePlatformFeeDto {
  /** Percent of each donation, e.g. 5 or 4.5. Two decimal places at most. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(25)
  ratePercent!: number;

  /** Kept in the fee history, so every change can be explained later. */
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class DeleteCampaignDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}
