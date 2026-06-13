import { SetMetadata } from '@nestjs/common';
import { Role, Permission } from '../constants/roles.enum';

export const ROLES_KEY = 'roles';
export const PERMS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...perms: Permission[]) => SetMetadata(PERMS_KEY, perms);
