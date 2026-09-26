import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaymentChannel, TransactionStatus, WithdrawalStatus } from '../../common/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

class Paged {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;
}

export class AdminMessagesQueryDto extends Paged {
  @IsOptional()
  @IsIn(['unread', 'read', 'all'])
  filter: 'unread' | 'read' | 'all' = 'all';
}

export class AdminDonationsQueryDto extends Paged {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(PaymentChannel)
  channel?: PaymentChannel;

  /** Donor name, email or phone, account email, campaign title or payment reference. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminWithdrawalsQueryDto extends Paged {
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;
}

export class MarkMessageDto {
  @IsIn([true, false])
  read!: boolean;
}
