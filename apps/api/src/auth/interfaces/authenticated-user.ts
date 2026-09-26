import { UserRole } from '../../common/enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  nationalIdNumber: string | null;
  countryCode: string;
}
