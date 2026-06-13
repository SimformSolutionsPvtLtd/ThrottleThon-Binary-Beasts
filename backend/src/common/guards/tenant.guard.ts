import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user?.tenantId) throw new ForbiddenException('No tenant context');

    const headerTenant = req.headers['x-tenant-id'] as string | undefined;
    if (headerTenant && headerTenant !== user.tenantId) {
      throw new ForbiddenException('Tenant mismatch between JWT and X-Tenant-Id header');
    }

    const paramTenant = req.params?.tenantId as string | undefined;
    if (paramTenant && paramTenant !== user.tenantId) {
      throw new ForbiddenException('Tenant mismatch between JWT and route parameter');
    }
    return true;
  }
}
