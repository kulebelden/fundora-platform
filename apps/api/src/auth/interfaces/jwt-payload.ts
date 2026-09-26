import { UserRole } from '../../common/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}
