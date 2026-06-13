import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { Permissions } from '../../common/constants/permissions';
import { AuthUser } from '../../common/types/auth-user';

@Injectable()
export class IdentityMapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getFullMap(tenantId: string, user: AuthUser, ipAddress?: string) {
    this.assertPermission(user);

    await this.auditLog.log({
      tenantId,
      userId: user.sub,
      action: 'identity_map_access',
      resource: 'full_map',
      details: { pseudonymCount: null },
      piiSanitised: false,
      ipAddress,
    });

    const entries = await this.prisma.pseudonymMap.findMany({
      where: { tenantId },
      select: { pseudonym: true, realName: true, email: true },
      orderBy: { pseudonym: 'asc' },
    });

    await this.auditLog.log({
      tenantId,
      userId: user.sub,
      action: 'identity_map_access',
      resource: 'full_map',
      details: { pseudonymCount: entries.length } as never,
      piiSanitised: false,
      ipAddress,
    });

    return Object.fromEntries(entries.map((e) => [e.pseudonym, { realName: e.realName, email: e.email }]));
  }

  async getByPseudonym(tenantId: string, pseudonym: string, user: AuthUser, ipAddress?: string) {
    this.assertPermission(user);

    await this.auditLog.log({
      tenantId,
      userId: user.sub,
      action: 'identity_map_access',
      resource: `pseudonym:${pseudonym}`,
      details: { pseudonym } as never,
      piiSanitised: false,
      ipAddress,
    });

    const entry = await this.prisma.pseudonymMap.findUnique({
      where: { tenantId_pseudonym: { tenantId, pseudonym } },
      select: { pseudonym: true, realName: true, email: true },
    });

    if (!entry) return null;
    return { pseudonym: entry.pseudonym, realName: entry.realName, email: entry.email };
  }

  private assertPermission(user: AuthUser): void {
    if (!user.permissions.includes(Permissions.IDENTITY_MAP_READ)) {
      throw new ForbiddenException('Insufficient permissions: identity-map:read required');
    }
  }
}
