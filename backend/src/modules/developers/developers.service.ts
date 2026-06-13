import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

const DEV_SELECT = {
  pseudonym: true,
  role: true,
  department: true,
  tenureYears: true,
  costBand: true,
  skills: true,
  currentAllocation: true,
  isActive: true,
} satisfies Prisma.DeveloperSelect;

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.developer.findMany({
      where: { tenantId, isActive: true },
      select: DEV_SELECT,
      orderBy: { pseudonym: 'asc' },
    });
  }

  async findOne(tenantId: string, pseudonym: string) {
    const dev = await this.prisma.developer.findUnique({
      where: { tenantId_pseudonym: { tenantId, pseudonym } },
      select: DEV_SELECT,
    });
    if (!dev || !dev.isActive) throw new NotFoundException('Developer not found');
    return dev;
  }

  async findBench(tenantId: string) {
    const developers = await this.prisma.developer.findMany({
      where: { tenantId, isActive: true },
      select: { ...DEV_SELECT, id: true },
      orderBy: { pseudonym: 'asc' },
    });

    const allocations = await this.prisma.allocation.findMany({
      where: { tenantId },
      select: { devPseudonym: true, allocationPercent: true },
    });

    const totalByPseudonym = new Map<string, number>();
    for (const a of allocations) {
      totalByPseudonym.set(
        a.devPseudonym,
        (totalByPseudonym.get(a.devPseudonym) ?? 0) + a.allocationPercent,
      );
    }

    return developers
      .map(({ id: _id, ...dev }) => ({
        ...dev,
        availablePercent: 100 - (totalByPseudonym.get(dev.pseudonym) ?? 0),
      }))
      .filter((d) => d.availablePercent > 0);
  }

  async create(tenantId: string, dto: CreateDeveloperDto) {
    const existing = await this.prisma.developer.findUnique({
      where: { tenantId_pseudonym: { tenantId, pseudonym: dto.pseudonym } },
    });
    if (existing) throw new ConflictException('Developer with this pseudonym already exists');

    return this.prisma.developer.create({
      data: {
        tenantId,
        pseudonym: dto.pseudonym,
        role: dto.role,
        department: dto.department,
        tenureYears: dto.tenureYears,
        costBand: dto.costBand,
        skills: (dto.skills ?? []) as Prisma.InputJsonValue,
        currentAllocation: (dto.currentAllocation ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
      },
      select: DEV_SELECT,
    });
  }

  async update(tenantId: string, pseudonym: string, dto: UpdateDeveloperDto) {
    await this.findOne(tenantId, pseudonym);
    return this.prisma.developer.update({
      where: { tenantId_pseudonym: { tenantId, pseudonym } },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.tenureYears !== undefined && { tenureYears: dto.tenureYears }),
        ...(dto.costBand !== undefined && { costBand: dto.costBand }),
        ...(dto.skills !== undefined && { skills: dto.skills as Prisma.InputJsonValue }),
        ...(dto.currentAllocation !== undefined && {
          currentAllocation: dto.currentAllocation as Prisma.InputJsonValue,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: DEV_SELECT,
    });
  }
}
