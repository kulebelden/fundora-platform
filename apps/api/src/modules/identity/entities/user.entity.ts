import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums';
import { UserProfile } from './user-profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.DONOR })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified!: boolean;

  /** Consecutive failed password logins; reset by a successful login or a password reset. */
  @Column({ type: 'integer', default: 0 })
  failedLoginCount!: number;

  /** Password logins are refused until this time, after too many failures in a row. */
  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  /** Access tokens issued before this are rejected, so a reset signs out every session. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;
}
