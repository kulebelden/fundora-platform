import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { IsNull, LessThan, MoreThan } from 'typeorm';
import { DataSource } from 'typeorm';
import { UserRole } from '../common/enums';
import { isSupportedCountry } from '../common/supported-markets';
import { EnvironmentVariables } from '../config/env.validation';
import { MailService } from '../mail/mail.service';
import { UserProfile } from '../modules/identity/entities/user-profile.entity';
import { User } from '../modules/identity/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './refresh-token.entity';
import { AuthResponse } from './interfaces/auth-response';
import { AuthenticatedUser } from './interfaces/authenticated-user';
import { JwtPayload } from './interfaces/jwt-payload';
import { TokenPair } from './interfaces/auth-response';
import type { OAuthProfile } from './oauth.service';
import { PasswordService } from './password.service';
import { EmailVerificationToken } from './email-verification-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { UserIdentity } from './user-identity.entity';

/** Used when a phone number's calling code is unknown or unsupported. */
const DEFAULT_COUNTRY_CODE = 'US';

/** How long a "confirm your email" link stays valid. */
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails to the same account. */
const RESEND_COOLDOWN_MS = 60 * 1000;

/** How long a "reset your password" link stays valid. Short: it is as good as the password. */
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

/** Minimum gap between two password reset emails to the same account. */
const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

/** Failed password logins in a row before the account is locked. */
const MAX_FAILED_LOGINS = 5;

/** How long a locked account refuses password logins. A password reset unlocks it at once. */
const LOCKOUT_MS = 15 * 60 * 1000;

/** Returned by sign-up: the account exists but cannot sign in until the email is confirmed. */
export interface VerificationPending {
  status: 'VERIFICATION_SENT';
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Verified against when no account matches a login, so a missing account costs the
   * same argon2 work as a wrong password and response time does not reveal which.
   */
  private readonly dummyPasswordHash: Promise<string>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly mail: MailService,
  ) {
    this.dummyPasswordHash = this.passwordService.hashPassword(randomBytes(32).toString('hex'));
  }

  /**
   * Creates the account and emails a verification link. No session is issued:
   * the first sign-in happens when the link is opened (see `verifyEmail`).
   * With EMAIL_VERIFICATION_REQUIRED=false the account starts verified and is signed in.
   */
  async register(dto: RegisterDto): Promise<VerificationPending | AuthResponse> {
    const verificationRequired = this.config.get('EMAIL_VERIFICATION_REQUIRED', { infer: true });
    const email = dto.email.toLowerCase();
    const phoneNumber = dto.phoneNumber;
    const created = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const existing = await users.findOne({
        where: [{ email }, { phoneNumber }],
      });

      if (existing) {
        throw new ConflictException(
          'A user with this email address or phone number already exists',
        );
      }

      const passwordHash = await this.passwordService.hashPassword(dto.password);
      const user = await users.save(
        users.create({
          email,
          phoneNumber,
          passwordHash,
          role: UserRole.DONOR,
          isEmailVerified: !verificationRequired,
        }),
      );

      const profiles = manager.getRepository(UserProfile);
      const profile = await profiles.save(
        profiles.create({
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          countryCode: this.countryCodeFromPhone(phoneNumber),
        }),
      );

      return { user, profile };
    });

    if (!verificationRequired) {
      const session = await this.issueSession(created.user);
      return { user: this.toAuthenticatedUser(created.user, created.profile), ...session };
    }

    await this.sendVerificationEmail(created.user, created.profile.firstName);
    return { status: 'VERIFICATION_SENT', email: created.user.email };
  }

  /**
   * Opens a verification link: marks the email verified, spends every
   * outstanding link for the account, and signs the person in.
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    const tokenHash = this.hashRefreshToken(token);
    const user = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(EmailVerificationToken);
      const record = await tokens.findOne({ where: { tokenHash } });
      if (!record || record.expiresAt <= new Date()) {
        throw new BadRequestException('This verification link is invalid or has expired. Request a new one.');
      }

      const users = manager.getRepository(User);
      await users.update({ id: record.userId }, { isEmailVerified: true });
      await tokens.delete({ userId: record.userId });
      return users.findOneOrFail({ where: { id: record.userId }, relations: { profile: true } });
    });

    const session = await this.issueSession(user);
    return { user: this.toAuthenticatedUser(user), ...session };
  }

  /**
   * Sends a fresh link if the account exists and is unverified. Answers the
   * same either way, so the endpoint cannot be used to discover accounts.
   */
  async resendVerification(rawEmail: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email },
      relations: { profile: true },
    });
    if (!user || user.isEmailVerified) return;

    const recent = await this.dataSource.getRepository(EmailVerificationToken).findOne({
      where: { userId: user.id, createdAt: MoreThan(new Date(Date.now() - RESEND_COOLDOWN_MS)) },
    });
    if (recent) return;

    await this.sendVerificationEmail(user, user.profile?.firstName ?? '');
  }

  private async sendVerificationEmail(user: Pick<User, 'id' | 'email'>, firstName: string): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    const tokens = this.dataSource.getRepository(EmailVerificationToken);
    // Expired links are dead weight; clear them while we are here.
    await tokens.delete({ userId: user.id, expiresAt: LessThan(new Date()) });
    await tokens.save(
      tokens.create({
        userId: user.id,
        tokenHash: this.hashRefreshToken(token),
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      }),
    );

    const link = `${this.appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

    await this.mail.send({
      to: user.email,
      subject: 'Confirm your email for HopeNest',
      text: `${greeting}\n\nConfirm your email address to finish creating your HopeNest account:\n\n${link}\n\nThe link works for 24 hours. If you did not sign up, you can ignore this email.`,
      html: verificationEmailHtml(escapeHtml(greeting), link),
    });
  }

  /**
   * Emails a reset link if the address has an account. Answers the same either way,
   * so the endpoint cannot be used to discover accounts.
   */
  async requestPasswordReset(rawEmail: string): Promise<void> {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.dataSource.getRepository(User).findOne({
      where: { email },
      relations: { profile: true },
    });
    if (!user) return;

    const tokens = this.dataSource.getRepository(PasswordResetToken);
    const recent = await tokens.findOne({
      where: { userId: user.id, createdAt: MoreThan(new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS)) },
    });
    if (recent) return;

    const token = randomBytes(32).toString('base64url');
    // One live link at a time: a new request spends every earlier one.
    await tokens.delete({ userId: user.id });
    await tokens.save(
      tokens.create({
        userId: user.id,
        tokenHash: this.hashRefreshToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      }),
    );

    const link = `${this.appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const firstName = user.profile?.firstName ?? '';
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

    await this.mail.send({
      to: user.email,
      subject: 'Reset your HopeNest password',
      text: `${greeting}\n\nSomeone asked to reset the password for your HopeNest account. To choose a new password, open:\n\n${link}\n\nThe link works for 30 minutes and can be used once. If you did not ask for this, ignore this email: your password stays the same.`,
      html: passwordResetEmailHtml(escapeHtml(greeting), link),
    });
  }

  /**
   * Sets a new password from an emailed link. Spends the link, unlocks the account,
   * and ends every existing session: refresh tokens are revoked and access tokens
   * issued before now are refused (see JwtStrategy). The person then signs in afresh.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(token);
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    const user = await this.dataSource.transaction(async (manager) => {
      const tokens = manager.getRepository(PasswordResetToken);
      const record = await tokens
        .createQueryBuilder('token')
        .setLock('pessimistic_write')
        .where('token."tokenHash" = :tokenHash', { tokenHash })
        .getOne();
      if (!record || record.expiresAt <= new Date()) {
        throw new BadRequestException('This reset link is invalid or has expired. Request a new one.');
      }

      const users = manager.getRepository(User);
      await users.update(
        { id: record.userId },
        {
          passwordHash,
          passwordChangedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
          // Opening the emailed link proves the person controls the address.
          isEmailVerified: true,
        },
      );
      await tokens.delete({ userId: record.userId });
      await manager
        .getRepository(RefreshToken)
        .update({ userId: record.userId, revokedAt: IsNull() }, { revokedAt: new Date() });
      return users.findOneOrFail({ where: { id: record.userId }, relations: { profile: true } });
    });

    const firstName = user.profile?.firstName ?? '';
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
    await this.mail
      .send({
        to: user.email,
        subject: 'Your HopeNest password was changed',
        text: `${greeting}\n\nThe password for your HopeNest account was just changed, and every device was signed out. If this was not you, reset your password straight away and contact our team.`,
        html: noticeEmailHtml(
          escapeHtml(greeting),
          'The password for your HopeNest account was just changed, and every device was signed out.',
          'If this was not you, reset your password straight away and contact our team.',
        ),
      })
      .catch((error: unknown) => this.logger.warn(`Password-changed notice not sent: ${String(error)}`));
  }

  private appUrl(): string {
    return (this.config.get('APP_URL', { infer: true }) ?? 'http://localhost:3001').replace(/\/+$/, '');
  }

  /**
   * Signs in with a Google or Apple identity, in this order:
   * 1. an identity already linked to a user — the provider's `sub` is stable;
   * 2. an existing user with the same, provider-verified email — linked now;
   * 3. otherwise a new donor account, with an unusable random password.
   */
  async signInWithOAuth(profile: OAuthProfile): Promise<AuthResponse> {
    const user = await this.dataSource.transaction(async (manager) => {
      const identities = manager.getRepository(UserIdentity);
      const users = manager.getRepository(User);

      const linked = await identities.findOne({
        where: { provider: profile.provider, subject: profile.subject },
      });
      if (linked) {
        return users.findOneOrFail({ where: { id: linked.userId }, relations: { profile: true } });
      }

      // An unverified address proves nothing about who owns the matching account.
      if (!profile.email || !profile.emailVerified) {
        throw new UnauthorizedException('Your account must have a verified email address to sign in');
      }

      let existing = await users.findOne({
        where: { email: profile.email },
        relations: { profile: true },
      });

      if (existing) {
        if (!existing.isEmailVerified) {
          existing.isEmailVerified = true;
          existing = await users.save(existing);
        }
      } else {
        const created = await users.save(
          users.create({
            email: profile.email,
            phoneNumber: null,
            passwordHash: await this.passwordService.hashPassword(randomUUID() + randomUUID()),
            role: UserRole.DONOR,
            isEmailVerified: true,
          }),
        );
        const profiles = manager.getRepository(UserProfile);
        created.profile = await profiles.save(
          profiles.create({
            userId: created.id,
            firstName: profile.firstName ?? profile.email.split('@')[0].slice(0, 100),
            lastName: profile.lastName ?? '',
            countryCode: DEFAULT_COUNTRY_CODE,
          }),
        );
        existing = created;
      }

      await identities.save(
        identities.create({
          userId: existing.id,
          provider: profile.provider,
          subject: profile.subject,
          email: profile.email,
        }),
      );
      return existing;
    });

    const tokens = await this.issueSession(user);
    return { user: this.toAuthenticatedUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const identifier = dto.emailOrPhone;
    const isEmail = identifier.includes('@');
    const users = this.dataSource.getRepository(User);
    const user = await users
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .addSelect('user.passwordHash')
      .where(isEmail ? 'user.email = :identifier' : 'user.phoneNumber = :identifier')
      .setParameters({
        identifier: isEmail ? identifier.toLowerCase() : identifier,
      })
      .getOne();

    if (!user) {
      await this.passwordService.verifyPassword(await this.dummyPasswordHash, dto.password);
      throw new UnauthorizedException('Invalid email, phone number, or password');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'ACCOUNT_LOCKED',
          message: 'Too many failed sign-in attempts. Try again in 15 minutes, or reset your password.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!(await this.passwordService.verifyPassword(user.passwordHash, dto.password))) {
      await this.recordFailedLogin(user.id);
      throw new UnauthorizedException('Invalid email, phone number, or password');
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await users.update({ id: user.id }, { failedLoginCount: 0, lockedUntil: null });
    }

    // Checked after the password, so this answer never reveals that an address is registered.
    if (!user.isEmailVerified && this.config.get('EMAIL_VERIFICATION_REQUIRED', { infer: true })) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        message: 'Confirm your email address first. We sent you a link when you signed up.',
      });
    }

    const tokens = await this.issueSession(user);

    return {
      user: this.toAuthenticatedUser(user),
      ...tokens,
    };
  }

  /** Counts a wrong password; the fifth in a row locks password logins for 15 minutes. */
  private async recordFailedLogin(userId: string): Promise<void> {
    // One atomic statement, so parallel guesses cannot slip past the limit.
    const rows: Array<{ failedLoginCount: number }> = await this.dataSource.query(
      `UPDATE "users"
          SET "failedLoginCount" = "failedLoginCount" + 1,
              "lockedUntil" = CASE WHEN "failedLoginCount" + 1 >= $2
                                   THEN now() + make_interval(secs => $3)
                                   ELSE "lockedUntil" END
        WHERE "id" = $1
    RETURNING "failedLoginCount"`,
      [userId, MAX_FAILED_LOGINS, LOCKOUT_MS / 1000],
    );
    const count = rows[0]?.failedLoginCount ?? 0;
    if (count >= MAX_FAILED_LOGINS) {
      // Start a fresh count once the lock ends.
      await this.dataSource.query(`UPDATE "users" SET "failedLoginCount" = 0 WHERE "id" = $1`, [userId]);
      this.logger.warn(`Account ${userId} locked for ${LOCKOUT_MS / 60000} minutes after ${count} failed logins`);
    }
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponse> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sub ||
      !payload.jti ||
      (userId && payload.sub !== userId)
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashRefreshToken(refreshToken);

    // A token that was already rotated out is being replayed: someone holds a stolen
    // copy. End every session for the account, the thief's and the owner's alike.
    const known = await this.dataSource
      .getRepository(RefreshToken)
      .findOne({ where: { tokenHash, userId: payload.sub } });
    if (known?.revokedAt && known.replacedBy) {
      await this.dataSource
        .getRepository(RefreshToken)
        .update({ userId: payload.sub, revokedAt: IsNull() }, { revokedAt: new Date() });
      this.logger.warn(`Refresh token reuse for user ${payload.sub}: all sessions revoked`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.issueTokenPair(
      payload.sub,
      payload.email,
      payload.role,
    );
    const now = new Date();

    const rotated = await this.dataSource.transaction(async (manager) => {
      const refreshTokens = manager.getRepository(RefreshToken);
      const current = await refreshTokens
        .createQueryBuilder('refreshToken')
        .setLock('pessimistic_write')
        .where('"tokenHash" = :tokenHash', { tokenHash })
        .andWhere('"userId" = :userId', { userId: payload.sub })
        .getOne();

      if (
        !current ||
        current.revokedAt !== null ||
        current.expiresAt <= now
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const replacement = refreshTokens.create({
        id: randomUUID(),
        userId: payload.sub,
        tokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: tokens.refreshTokenExpiresAt,
      });

      current.revokedAt = now;
      current.replacedBy = replacement.id;
      await refreshTokens.save(current);
      await refreshTokens.save(replacement);

      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.id = :userId', { userId: payload.sub })
        .getOne();

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      return user;
    });

    return {
      user: this.toAuthenticatedUser(rotated),
      ...tokens,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.dataSource.getRepository(RefreshToken).update(
      { tokenHash },
      {
        revokedAt: new Date(),
      },
    );
  }

  /**
   * Starts a new session: a token pair plus the stored refresh-token row that
   * `refreshTokens` looks up and rotates. Without the row, the first refresh
   * fails and the session ends when the access token expires.
   */
  private async issueSession(user: Pick<User, 'id' | 'email' | 'role'>): Promise<TokenPair> {
    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    const refreshTokens = this.dataSource.getRepository(RefreshToken);
    await refreshTokens.save(
      refreshTokens.create({
        id: randomUUID(),
        userId: user.id,
        tokenHash: this.hashRefreshToken(tokens.refreshToken),
        expiresAt: tokens.refreshTokenExpiresAt,
      }),
    );
    return tokens;
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<TokenPair> {
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpiresIn = this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN');
    const refreshExpiresIn = this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          email,
          role,
          type: 'access',
          jti: randomUUID(),
        },
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn,
          subject: userId,
        },
      ),
      this.jwtService.signAsync(
        {
          email,
          role,
          type: 'refresh',
          jti: randomUUID(),
        },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
          subject: userId,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: this.expiresAtFromToken(accessToken),
      refreshTokenExpiresAt: this.expiresAtFromToken(refreshToken),
    };
  }

  private expiresAtFromToken(token: string): Date {
    const payload = this.jwtService.decode(token) as Pick<JwtPayload, 'exp'> | null;

    if (!payload?.exp) {
      throw new Error('JWT payload is missing an expiration time');
    }

    return new Date(payload.exp * 1000);
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthenticatedUser(
    user: User,
    profile?: UserProfile,
  ): AuthenticatedUser {
    const resolvedProfile = profile ?? user.profile;

    if (!resolvedProfile) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: resolvedProfile.firstName,
      lastName: resolvedProfile.lastName,
      avatarUrl: resolvedProfile.avatarUrl,
      nationalIdNumber: resolvedProfile.nationalIdNumber,
      countryCode: resolvedProfile.countryCode,
    };
  }

  /**
   * Best-effort country from the phone's calling code. Only the supported
   * US-dollar and euro markets are listed; anything else — including an
   * unrecognised code — falls back to the default so the stored value is
   * always one the platform can pay out to.
   */
  private countryCodeFromPhone(phoneNumber: string): string {
    // Puerto Rico shares +1 with the US, so it resolves to US here.
    const callingCodes: Record<string, string> = {
      '+1': 'US',
      '+30': 'GR',
      '+31': 'NL',
      '+32': 'BE',
      '+33': 'FR',
      '+34': 'ES',
      '+39': 'IT',
      '+43': 'AT',
      '+49': 'DE',
      '+351': 'PT',
      '+352': 'LU',
      '+353': 'IE',
      '+356': 'MT',
      '+357': 'CY',
      '+358': 'FI',
      '+370': 'LT',
      '+371': 'LV',
      '+372': 'EE',
      '+385': 'HR',
      '+386': 'SI',
      '+421': 'SK',
      '+503': 'SV',
      '+507': 'PA',
      '+593': 'EC',
      '+670': 'TL',
      '+680': 'PW',
      '+691': 'FM',
      '+692': 'MH',
    };

    // Calling codes are prefix-free, so the longest listed prefix is the match;
    // a fixed-length slice would read "+4915…" as "+491".
    const digits = phoneNumber.replace(/[^\d+]/g, '');
    for (let length = 4; length >= 2; length -= 1) {
      const resolved = callingCodes[digits.slice(0, length)];
      if (resolved && isSupportedCountry(resolved)) return resolved;
    }
    return DEFAULT_COUNTRY_CODE;
  }
}

/** For text from users (names) placed into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function passwordResetEmailHtml(greeting: string, link: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:16px;padding:32px 28px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#002b66">HopeNest</p>
      <p style="margin:24px 0 8px;font-size:16px">${greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Someone asked to reset the password for your HopeNest account.</p>
      <a href="${link}" style="display:inline-block;background:#00a86b;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 24px;border-radius:10px">Choose a new password</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5b6b82">The link works for 30 minutes and can be used once. If the button does not open, paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5b6b82;text-align:center">If you did not ask for this, ignore this email. Your password stays the same.</p>
  </div>
</body></html>`;
}

function noticeEmailHtml(greeting: string, body: string, footer: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:16px;padding:32px 28px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#002b66">HopeNest</p>
      <p style="margin:24px 0 8px;font-size:16px">${greeting}</p>
      <p style="margin:0;font-size:15px;line-height:1.5">${body}</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5b6b82;text-align:center">${footer}</p>
  </div>
</body></html>`;
}

/** Plain, table-free markup: renders the same in Gmail, Outlook and phone mail apps. */
function verificationEmailHtml(greeting: string, link: string): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0b1f3a">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:16px;padding:32px 28px">
      <p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#002b66">HopeNest</p>
      <p style="margin:24px 0 8px;font-size:16px">${greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5">Confirm your email address to finish creating your account.</p>
      <a href="${link}" style="display:inline-block;background:#00a86b;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 24px;border-radius:10px">Confirm my email</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5b6b82">The link works for 24 hours. If the button does not open, paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5b6b82;text-align:center">If you did not sign up for HopeNest, you can ignore this email.</p>
  </div>
</body></html>`;
}
