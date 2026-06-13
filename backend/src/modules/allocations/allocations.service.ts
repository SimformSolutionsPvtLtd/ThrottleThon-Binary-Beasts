import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ForecastService } from '../forecast/forecast.service';
import { AllocationDto } from './dto/allocation.dto';

@Injectable()
export class AllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecastService: ForecastService,
  ) {}

  findAll(tenantId: string, scenarioExternalId?: string) {
    return this.prisma.allocation.findMany({
      where: {
        tenantId,
        ...(scenarioExternalId ? { scenarioExternalId } : {}),
      },
      orderBy: [{ scenarioExternalId: 'asc' }, { devPseudonym: 'asc' }],
    });
  }

  async upsertOne(tenantId: string, dto: AllocationDto) {
    await this.validateOverAllocation(tenantId, dto.devPseudonym, dto.scenarioExternalId, dto.allocationPercent);

    // Verify dev exists
    const dev = await this.prisma.developer.findUnique({
      where: { tenantId_pseudonym: { tenantId, pseudonym: dto.devPseudonym } },
    });
    if (!dev) throw new NotFoundException(`Developer '${dto.devPseudonym}' not found`);

    // Verify scenario exists
    const scenario = await this.prisma.scenario.findUnique({
      where: { tenantId_externalId: { tenantId, externalId: dto.scenarioExternalId } },
    });
    if (!scenario) throw new NotFoundException(`Scenario '${dto.scenarioExternalId}' not found`);

    const allocation = await this.prisma.allocation.upsert({
      where: {
        tenantId_devPseudonym_scenarioExternalId: {
          tenantId,
          devPseudonym: dto.devPseudonym,
          scenarioExternalId: dto.scenarioExternalId,
        },
      },
      update: { allocationPercent: dto.allocationPercent },
      create: {
        tenantId,
        devPseudonym: dto.devPseudonym,
        scenarioExternalId: dto.scenarioExternalId,
        allocationPercent: dto.allocationPercent,
      },
    });

    const forecast = await this.forecastService.computeScenarioForecast(tenantId, dto.scenarioExternalId);
    return { allocation, forecast };
  }

  async upsertBulk(tenantId: string, items: AllocationDto[]) {
    const results = [];
    for (const item of items) {
      results.push(await this.upsertOne(tenantId, item));
    }
    return results;
  }

  async removeOne(tenantId: string, scenarioExternalId: string, devPseudonym: string) {
    const existing = await this.prisma.allocation.findUnique({
      where: {
        tenantId_devPseudonym_scenarioExternalId: {
          tenantId,
          devPseudonym,
          scenarioExternalId,
        },
      },
    });
    if (!existing) throw new NotFoundException('Allocation not found');

    await this.prisma.allocation.delete({
      where: {
        tenantId_devPseudonym_scenarioExternalId: {
          tenantId,
          devPseudonym,
          scenarioExternalId,
        },
      },
    });
    return { success: true };
  }

  async removeByScenario(tenantId: string, scenarioExternalId: string) {
    const { count } = await this.prisma.allocation.deleteMany({
      where: { tenantId, scenarioExternalId },
    });
    return { deleted: count };
  }

  private async validateOverAllocation(
    tenantId: string,
    devPseudonym: string,
    scenarioExternalId: string,
    newPercent: number,
  ) {
    const existing = await this.prisma.allocation.findMany({
      where: { tenantId, devPseudonym },
    });

    // Exclude the current scenario (we're replacing it with the new value)
    const othersTotal = existing
      .filter((a) => a.scenarioExternalId !== scenarioExternalId)
      .reduce((sum, a) => sum + a.allocationPercent, 0);

    const totalAfter = othersTotal + newPercent;
    if (totalAfter > 100) {
      const available = 100 - othersTotal;
      throw new BadRequestException(
        `${devPseudonym} is allocated ${othersTotal}% elsewhere. Available: ${available}%`,
      );
    }
  }
}
