import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from './register.dto';

export class ForgotPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  /** 32 random bytes, base64url: 43 characters. */
  @IsString()
  @Length(20, 128)
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_RULE, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}
