import { Injectable, NotFoundException } from '@nestjs/common';
import { Debate, Prisma, RiskSeverity } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ResearcherAgent } from './agents/researcher.agent';
import { OpponentAgent } from './agents/opponent.agent';
import { WorstCaseAgent } from './agents/worst-case.agent';
import { SynthesizerAgent } from './agents/synthesizer.agent';

@Injectable()
export class DebateOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly researcher: ResearcherAgent,
    private readonly opponent: OpponentAgent,
    private readonly worst: WorstCaseAgent,
    private readonly synth: SynthesizerAgent,
  ) {}

  async runForScenario(scenarioId: string): Promise<Debate> {
    const scenario = await this.prisma.scenario.findUnique({ where: { id: scenarioId } });
    if (!scenario) throw new NotFoundException(`Scenario ${scenarioId} not found`);

    const context = JSON.stringify({
      name: scenario.name,
      category: scenario.category,
      assumptions: scenario.assumptions,
    });

    const researcher = await this.researcher.run(context);
    const [opponent, worst] = await Promise.all([
      this.opponent.run(context, researcher.raw),
      this.worst.run(context),
    ]);
    const synth = await this.synth.run(context, researcher.raw, opponent.raw, worst.raw);

    return this.prisma.debate.create({
      data: {
        scenarioId,
        confidenceScore: synth.confidenceScore,
        frictionFactor: synth.frictionFactor,
        summary: synth.summary,
        transcript: {
          researcher: researcher,
          opponent: opponent,
          worstCase: worst,
          synthesizer: synth,
        } as unknown as Prisma.InputJsonValue,
        risks: {
          create: worst.risks.map((r) => ({
            title: r.title,
            description: r.description,
            severity: r.severity ?? RiskSeverity.MEDIUM,
            likelihood: r.likelihood,
            impact: r.impact,
          })),
        },
      },
      include: { risks: true },
    });
  }
}
