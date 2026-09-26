import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycStatus } from '../../common/enums';

export class ReviewKycDto {
  @IsIn([KycStatus.VERIFIED, KycStatus.REJECTED])
  status!: KycStatus.VERIFIED | KycStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
