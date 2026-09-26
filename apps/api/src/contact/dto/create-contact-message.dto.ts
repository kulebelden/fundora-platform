import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CONTACT_TOPICS, ContactTopic } from '../contact.constants';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;
const trimOrUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class CreateContactMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @Matches(/^\+?[0-9 ()-]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsIn(CONTACT_TOPICS)
  topic!: ContactTopic;

  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @Transform(trim)
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  // require_tld off so links to a local or staging copy of the site are accepted.
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  campaignLink?: string;

  /**
   * Honeypot: a field hidden from people. Bots that fill every input set it,
   * and the message is quietly dropped.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
