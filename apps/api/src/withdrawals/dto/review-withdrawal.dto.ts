import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { WithdrawalStatus } from '../../common/enums';

export type WithdrawalReviewDecision = WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED;

export class ReviewWithdrawalDto {
  @IsIn([WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED])
  status!: WithdrawalReviewDecision;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
