import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { UserRole } from '../common/enums';
import { EnvironmentVariables } from '../config/env.validation';
import { UserProfile } from '../modules/identity/entities/user-profile.entity';
import { User } from '../modules/identity/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './refresh-token.entity';
import { AuthResponse } from './interfaces/auth-response';
import { AuthenticatedUser } from './interfaces/authenticated-user';
import { JwtPayload } from './interfaces/jwt-payload';
import { TokenPair } from './interfaces/auth-response';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
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

    const tokens = await this.issueTokenPair(
      created.user.id,
      created.user.email,
      created.user.role,
    );

    return {
      user: this.toAuthenticatedUser(created.user, created.profile),
      ...tokens,
    };
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

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);

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

  private countryCodeFromPhone(phoneNumber: string): string {
    const callingCodes: Record<string, string> = {
      '+1': 'US',
      '+250': 'RW',
      '+254': 'KE',
      '+255': 'TZ',
      '+256': 'UG',
      '+260': 'ZM',
      '+44': 'GB',
    };
    const callingCode = phoneNumber.match(/^\+\d{1,3}/)?.[0] ?? '';

    return callingCodes[callingCode] ?? 'UG';
  }
}
