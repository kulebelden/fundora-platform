import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nationalIdOrPassport!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  documentUrl!: string;
}
