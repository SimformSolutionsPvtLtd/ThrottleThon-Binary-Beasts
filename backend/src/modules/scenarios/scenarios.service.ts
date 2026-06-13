import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.scenario.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        externalId: true,
        name: true,
        description: true,
        category: true,
        baseEffortPoints: true,
        config: true,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(tenantId: string, externalId: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { tenantId_externalId: { tenantId, externalId } },
    });
    if (!scenario || !scenario.isActive) throw new NotFoundException('Scenario not found');
    return scenario;
  }

  async create(tenantId: string, dto: CreateScenarioDto) {
    const existing = await this.prisma.scenario.findUnique({
      where: { tenantId_externalId: { tenantId, externalId: dto.externalId } },
    });
    if (existing) throw new ConflictException('Scenario with this externalId already exists');

    return this.prisma.scenario.create({
      data: {
        tenantId,
        externalId: dto.externalId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        baseEffortPoints: dto.baseEffortPoints,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async update(tenantId: string, externalId: string, dto: UpdateScenarioDto) {
    await this.findOne(tenantId, externalId);
    return this.prisma.scenario.update({
      where: { tenantId_externalId: { tenantId, externalId } },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.baseEffortPoints !== undefined && { baseEffortPoints: dto.baseEffortPoints }),
        ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
      },
    });
  }

  async softDelete(tenantId: string, externalId: string) {
    await this.findOne(tenantId, externalId);
    await this.prisma.scenario.update({
      where: { tenantId_externalId: { tenantId, externalId } },
      data: { isActive: false },
    });
    return { success: true };
  }
}
