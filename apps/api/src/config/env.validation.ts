import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/*
 * Reads the raw env string: implicit conversion has already run by the time a
 * transform sees `value`, and it turns any non-empty string, "false" included,
 * into `true`.
 */
const toBoolean = ({ obj, key, value }: { obj: Record<string, unknown>; key: string; value: unknown }): unknown => {
  const raw = obj[key];
  return typeof raw === 'string' ? raw.trim().toLowerCase() === 'true' : value;
};

/*
 * Numeric and boolean fields carry explicit type annotations: implicit
 * conversion reads the emitted design type, and the transpile-only loader the
 * TypeORM CLI uses cannot infer one from an initialiser alone.
 */
export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  DB_NAME!: string;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD!: string;

  @Transform(toBoolean)
  @IsBoolean()
  DB_SSL: boolean = false;

  @IsString()
  REDIS_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN = '7d';

  /*
   * Social sign-in. Each provider switches on only when all of its values are
   * set; the web app hides nothing but disables a provider that is off.
   */

  /** Public origin of the web app, e.g. https://hopenest.org. Builds OAuth redirect URIs. */
  @IsOptional()
  @IsString()
  APP_URL?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  /** The Apple "Services ID", not the app's bundle ID. */
  @IsOptional()
  @IsString()
  APPLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  APPLE_TEAM_ID?: string;

  @IsOptional()
  @IsString()
  APPLE_KEY_ID?: string;

  /** Contents of the .p8 key. Newlines may be written as literal "\n". */
  @IsOptional()
  @IsString()
  APPLE_PRIVATE_KEY?: string;

  /**
   * When false, new accounts are verified on creation and signed straight in, and
   * login does not ask for a confirmed email. For development deploys without SMTP.
   */
  @Transform(toBoolean)
  @IsBoolean()
  EMAIL_VERIFICATION_REQUIRED: boolean = true;

  /*
   * Outgoing email (verification links). Any SMTP provider works. With no
   * SMTP_HOST, emails are not sent and their links are written to the log, so
   * sign-up can still be tested locally.
   */
  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT: number = 587;

  /** true for port 465 (TLS from the start); false for 587 (STARTTLS). */
  @Transform(toBoolean)
  @IsBoolean()
  SMTP_SECURE: boolean = false;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  /** Sender shown to users, e.g. "HopeNest <no-reply@hopenest.org>". */
  @IsString()
  MAIL_FROM = 'HopeNest <no-reply@hopenest.local>';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return validated;
}
