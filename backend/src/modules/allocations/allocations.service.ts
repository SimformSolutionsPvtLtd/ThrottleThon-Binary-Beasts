import { Injectable } from '@nestjs/common';
import { Allocation } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';

@Injectable()
export class AllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(scenarioId?: string): Promise<Allocation[]> {
    return this.prisma.allocation.findMany({
      where: scenarioId ? { scenarioId } : undefined,
      include: { developer: true },
    });
  }

  create(dto: CreateAllocationDto): Promise<Allocation> {
    return this.prisma.allocation.create({
      data: {
        developerId: dto.developerId,
        scenarioId: dto.scenarioId,
        allocationPercent: dto.allocationPercent,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes,
      },
    });
  }
}
