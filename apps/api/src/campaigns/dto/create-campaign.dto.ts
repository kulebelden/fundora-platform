import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  isURL,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateBy,
} from 'class-validator';
import { LOCAL_COVER_URL } from '../../uploads/uploads.constants';

/** An https image link, or a cover this API stored via POST /uploads/campaign-cover. */
function IsCoverImageUrl() {
  return ValidateBy({
    name: 'isCoverImageUrl',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        (LOCAL_COVER_URL.test(value) ||
          isURL(value, { protocols: ['https'], require_protocol: true })),
      defaultMessage: () =>
        'coverImageUrl must be an https URL or an uploaded cover photo',
    },
  });
}

export class CreateCampaignDto {
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  title!: string;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(50)
  story!: string;

  @IsOptional()
  @IsCoverImageUrl()
  @MaxLength(2048)
  coverImageUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
   @Min(1000)
  targetAmount!: number;

  @IsString()
  @MaxLength(3)
  currency = 'UGX';

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}
