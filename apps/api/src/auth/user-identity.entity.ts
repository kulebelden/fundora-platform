import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../modules/identity/entities/user.entity';

export type OAuthProvider = 'google' | 'apple';

/**
 * A sign-in from an outside identity provider, linked to one HopeNest user.
 *
 * Accounts are found by the provider's stable subject id, never by email:
 * Apple may hand out a private relay address, and anyone can change the email
 * on their Google account.
 */
@Entity({ name: 'user_identities' })
@Index('UQ_user_identities_provider_subject', ['provider', 'subject'], { unique: true })
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_user_identities_user_id')
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 16 })
  provider!: OAuthProvider;

  /** The provider's `sub` claim. */
  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  /** Email the provider reported at link time; informational only. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
