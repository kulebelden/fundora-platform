import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but a missing or invalid token is not an error: the
 * request simply proceeds without `req.user`. For endpoints anyone may call
 * that should still recognise a signed-in user (donating, contacting support).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(_error: unknown, user: TUser | false): TUser | undefined {
    return user || undefined;
  }
}
