import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Scenario } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId?: string): Promise<Scenario[]> {
    return this.prisma.scenario.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Scenario> {
    const s = await this.prisma.scenario.findUnique({
      where: { id },
      include: { allocations: true, forecasts: true, debates: true },
    });
    if (!s) throw new NotFoundException(`Scenario ${id} not found`);
    return s;
  }

  create(dto: CreateScenarioDto, userId: string): Promise<Scenario> {
    return this.prisma.scenario.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        category: dto.category,
        assumptions: (dto.assumptions ?? {}) as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });
  }
}
