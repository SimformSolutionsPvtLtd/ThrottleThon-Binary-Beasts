import { Global, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  details?: Prisma.InputJsonValue;
  piiSanitised?: boolean;
  ipAddress?: string;
}

@Global()
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details ?? Prisma.JsonNull,
        piiSanitised: entry.piiSanitised ?? true,
        ipAddress: entry.ipAddress,
      },
    });
  }

  async findAll(
    tenantId: string,
    opts: { page?: number; limit?: number; action?: string; startDate?: Date; endDate?: Date },
  ) {
    const { page = 1, limit = 20, action, startDate, endDate } = opts;

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(action && { action }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          resource: true,
          details: true,
          piiSanitised: true,
          ipAddress: true,
          createdAt: true,
          userId: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
