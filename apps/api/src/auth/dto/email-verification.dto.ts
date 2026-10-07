import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class VerifyEmailDto {
  /** 32 random bytes, base64url: 43 characters. */
  @IsString()
  @Length(20, 128)
  token!: string;
}

export class ResendVerificationDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
