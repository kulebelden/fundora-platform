import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CampaignStatus } from '../../common/enums';

/**
 * Moderation queue filter. Unlike CampaignQueryDto (public, hard-wired to LIVE and
 * COMPLETED), this can reach every status — which is the whole point of a review
 * queue, and why the endpoint using it is role-guarded.
 */
export class AdminCampaignQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  /** Omitted means every status. */
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}
