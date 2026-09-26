import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class PlatformStatsQueryDto {
  /**
   * Currency the headline `totalRaised` figure is reported in. Amounts in other
   * currencies are never converted, only reported separately.
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @Length(3, 3)
  currency?: string;
}
