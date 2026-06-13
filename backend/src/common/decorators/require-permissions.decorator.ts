import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../constants/permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...perms: PermissionAction[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
