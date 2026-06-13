import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { DebateResultOutput } from '../ai/schemas/debate-result.schema';

@Injectable()
export class DebateService {
  constructor(private readonly prisma: PrismaService) {}

  async saveResult(
    tenantId: string,
    scenarioExternalId: string,
    result: DebateResultOutput,
    isFixture: boolean,
  ) {
    return this.prisma.debateResult.create({
      data: {
        tenantId,
        scenarioExternalId,
        frictionFactor: result.frictionFactor,
        confidenceScore: result.confidenceScore,
        keyRisks: result.keyRisks as never,
        debateLog: result.debateLog as never,
        isFixture,
      },
    });
  }

  async getLatest(tenantId: string, scenarioExternalId: string) {
    const result = await this.prisma.debateResult.findFirst({
      where: { tenantId, scenarioExternalId },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) throw new NotFoundException(`No debate result found for scenario "${scenarioExternalId}"`);
    return result;
  }
}
