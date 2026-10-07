import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { LessThan, MoreThan } from 'typeorm';
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
import { UserIdentity } from './user-identity.entity';

/** Used when a phone number's calling code is unknown or unsupported. */
const DEFAULT_COUNTRY_CODE = 'US';

/** How long a "confirm your email" link stays valid. */
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between two verification emails to the same account. */
const RESEND_COOLDOWN_MS = 60 * 1000;

/** Returned by sign-up: the account exists but cannot sign in until the email is confirmed. */
export interface VerificationPending {
  status: 'VERIFICATION_SENT';
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly mail: MailService,
  ) {}

  /**
   * Creates the account and emails a verification link. No session is issued:
   * the first sign-in happens when the link is opened (see `verifyEmail`).
   */
  async register(dto: RegisterDto): Promise<VerificationPending> {
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

    const appUrl = (this.config.get('APP_URL', { infer: true }) ?? 'http://localhost:3001').replace(/\/+$/, '');
    const link = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

    await this.mail.send({
      to: user.email,
      subject: 'Confirm your email for HopeNest',
      text: `${greeting}\n\nConfirm your email address to finish creating your HopeNest account:\n\n${link}\n\nThe link works for 24 hours. If you did not sign up, you can ignore this email.`,
      html: verificationEmailHtml(greeting, link),
    });
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

    if (!user || !(await this.passwordService.verifyPassword(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email, phone number, or password');
    }

    // Checked after the password, so this answer never reveals that an address is registered.
    if (!user.isEmailVerified) {
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
