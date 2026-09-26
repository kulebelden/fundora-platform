import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums';
import { EnvironmentVariables } from '../../config/env.validation';
import { User } from '../../modules/identity/entities/user.entity';
import { ACCESS_TOKEN_COOKIE } from '../constants';
import { AuthenticatedUser } from '../interfaces/authenticated-user';
import { JwtPayload } from '../interfaces/jwt-payload';

type CookieRequest = Request & {
  cookies?: Record<string, string>;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => (request as CookieRequest).cookies?.[ACCESS_TOKEN_COOKIE],
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /** Passport attaches the returned value to `request.user`. */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (
      payload.type !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      !Object.values(UserRole).includes(payload.role as UserRole)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.users.findOne({
      where: { id: payload.sub },
      relations: { profile: true },
    });

    if (
      !user ||
      user.email !== payload.email ||
      user.role !== (payload.role as UserRole) ||
      !user.profile
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      avatarUrl: user.profile.avatarUrl,
      nationalIdNumber: user.profile.nationalIdNumber,
      countryCode: user.profile.countryCode,
    };

    return authenticatedUser;
  }
}
