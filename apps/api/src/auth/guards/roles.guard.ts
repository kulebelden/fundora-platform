import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndMerge<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      return false;
    }

    /**
     * SUPER_ADMIN outranks every other role, so it satisfies any @Roles requirement.
     * Without this, the role is decorative: no handler lists SUPER_ADMIN explicitly,
     * which locked it out of campaign review, KYC review and withdrawal approval —
     * exactly the actions it exists for. CampaignsService already treats it as
     * outranking ADMIN in FINANCE_ROLES, so this makes the guard agree.
     */
    if (request.user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    return roles.includes(request.user.role);
  }
}
