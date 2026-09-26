import {
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CampaignStatus } from '../../common/enums';

export const ALLOWED_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> =
  {
    [CampaignStatus.DRAFT]: [CampaignStatus.SUBMITTED],
    [CampaignStatus.SUBMITTED]: [
      CampaignStatus.APPROVED,
      CampaignStatus.REJECTED,
      CampaignStatus.SUSPENDED,
    ],
    [CampaignStatus.APPROVED]: [
      CampaignStatus.LIVE,
      CampaignStatus.REJECTED,
      CampaignStatus.SUSPENDED,
    ],
    [CampaignStatus.LIVE]: [
      CampaignStatus.COMPLETED,
      CampaignStatus.SUSPENDED,
    ],
    [CampaignStatus.COMPLETED]: [CampaignStatus.LIVE, CampaignStatus.SUSPENDED],
    [CampaignStatus.UNDER_REVIEW]: [
      CampaignStatus.APPROVED,
      CampaignStatus.REJECTED,
      CampaignStatus.SUSPENDED,
    ],
    [CampaignStatus.REJECTED]: [CampaignStatus.SUSPENDED, CampaignStatus.APPROVED],
    [CampaignStatus.SUSPENDED]: [
      CampaignStatus.APPROVED,
      CampaignStatus.REJECTED,
      CampaignStatus.LIVE,
    ],
  };

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  @IsNotEmpty()
  status!: CampaignStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
