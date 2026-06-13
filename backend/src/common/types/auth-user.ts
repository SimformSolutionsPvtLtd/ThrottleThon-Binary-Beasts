import { PermissionAction } from '../constants/permissions';

export interface AuthUser {
  sub: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roleName: string;
  permissions: PermissionAction[];
}
