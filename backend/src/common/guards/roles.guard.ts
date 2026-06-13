import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMS_KEY } from '../decorators/roles.decorator';
import { Permission, Role, RolePermissions } from '../constants/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const requiredPerms = this.reflector.getAllAndOverride<Permission[]>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles?.length && !requiredPerms?.length) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No authenticated user');

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Role ${user.role} not permitted`);
    }
    if (requiredPerms?.length) {
      const granted = RolePermissions[user.role as Role] ?? [];
      const missing = requiredPerms.filter((p) => !granted.includes(p));
      if (missing.length) throw new ForbiddenException(`Missing permissions: ${missing.join(', ')}`);
    }
    return true;
  }
}
