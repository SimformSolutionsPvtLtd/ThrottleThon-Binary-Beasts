import { Injectable } from '@nestjs/common';
import { AuditAction, AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string;
  performedBy?: string;
  payload?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(entry: AuditEntry): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data: entry });
  }

  list(entity?: string, entityId?: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
  }
}
