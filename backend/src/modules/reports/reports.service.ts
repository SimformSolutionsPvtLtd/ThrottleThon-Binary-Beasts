import { Injectable } from '@nestjs/common';
import { Report } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface BriefInput {
  scenarioId: string;
  audience: 'CEO' | 'CFO' | 'CTO';
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async brief(input: BriefInput, userId: string): Promise<Report> {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: input.scenarioId },
      include: { forecasts: { orderBy: { createdAt: 'desc' }, take: 1 }, debates: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const fc = scenario?.forecasts[0];
    const db = scenario?.debates[0];

    const payload = {
      audience: input.audience,
      scenario: scenario?.name,
      cost: fc?.cost,
      riskAdjustedCost: fc?.riskAdjustedCost,
      timelineDays: fc?.timelineDays,
      confidence: db?.confidenceScore ?? fc?.confidence,
      summary: db?.summary,
    };

    return this.prisma.report.create({
      data: {
        title: `${input.audience} Brief — ${scenario?.name ?? 'Scenario'}`,
        kind: `${input.audience.toLowerCase()}-brief`,
        payload,
        generatedBy: userId,
      },
    });
  }
}
