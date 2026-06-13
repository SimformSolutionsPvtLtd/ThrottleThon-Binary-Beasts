import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { name: true, slug: true, plan: true },
    });

    const [repoCount, ticketCount, employeeCount, sprintGroups] = await Promise.all([
      this.prisma.gitRepository.count({ where: { tenantId } }),
      this.prisma.jiraTicket.count({ where: { tenantId } }),
      this.prisma.developer.count({ where: { tenantId, isActive: true } }),
      this.prisma.jiraTicket.groupBy({ by: ['sprint'], where: { tenantId } }),
    ]);

    return {
      tenant: { name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      sources: {
        git: { mode: 'sandbox', repoCount, lastSyncAt: null },
        jira: {
          mode: 'sandbox',
          ticketCount,
          sprintCount: sprintGroups.length,
          lastSyncAt: null,
        },
        hrms: { mode: 'sandbox', employeeCount, lastSyncAt: null },
      },
    };
  }
}
