import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class LoginDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  emailOrPhone!: string;

  /** Capped so a huge "password" cannot tie up argon2. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
