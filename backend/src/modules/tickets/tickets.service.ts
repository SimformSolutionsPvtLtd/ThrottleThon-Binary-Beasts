import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TicketsQueryDto } from './dto/tickets-query.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: TicketsQueryDto) {
    const { sprint, labels, assigneePseudonym, page = 1, limit = 20 } = query;

    const where: Prisma.JiraTicketWhereInput = {
      tenantId,
      ...(sprint && { sprint }),
      ...(assigneePseudonym && { assigneePseudonym }),
      ...(labels?.length && { labels: { hasSome: labels } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.jiraTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jiraTicket.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getStats(tenantId: string) {
    const tickets = await this.prisma.jiraTicket.findMany({
      where: { tenantId },
      select: {
        estimatedPoints: true,
        actualPoints: true,
        labels: true,
        sprint: true,
      },
    });

    const totalTickets = tickets.length;
    const sprints = new Set(tickets.map((t) => t.sprint));
    const totalSprints = sprints.size;

    const overrunRatios = tickets
      .filter((t) => t.estimatedPoints > 0)
      .map((t) => t.actualPoints / t.estimatedPoints);

    const avgOverrunRatio =
      overrunRatios.length > 0
        ? overrunRatios.reduce((s, r) => s + r, 0) / overrunRatios.length
        : 0;

    const labelMap = new Map<string, { count: number; totalOverrun: number; validCount: number }>();
    for (const ticket of tickets) {
      const ratio =
        ticket.estimatedPoints > 0 ? ticket.actualPoints / ticket.estimatedPoints : null;
      for (const label of ticket.labels) {
        if (!labelMap.has(label)) {
          labelMap.set(label, { count: 0, totalOverrun: 0, validCount: 0 });
        }
        const entry = labelMap.get(label)!;
        entry.count++;
        if (ratio !== null) {
          entry.totalOverrun += ratio;
          entry.validCount++;
        }
      }
    }

    const labelBreakdown = Array.from(labelMap.entries()).map(([label, stats]) => ({
      label,
      count: stats.count,
      avgOverrun: stats.validCount > 0 ? stats.totalOverrun / stats.validCount : 0,
    }));

    return { totalTickets, totalSprints, avgOverrunRatio, labelBreakdown };
  }
}
