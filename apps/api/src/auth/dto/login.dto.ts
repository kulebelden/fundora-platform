import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class LoginDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  emailOrPhone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
