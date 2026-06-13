import { Injectable } from '@nestjs/common';
import { AiMeta, AiProvider } from '../interfaces/ai-provider.interface';

@Injectable()
export class FixtureProvider implements AiProvider {
  async parseIngestion(
    source: 'jira' | 'git' | 'hrms',
    _sanitisedData: unknown,
    _schema: unknown,
  ): Promise<{ data: unknown; meta: AiMeta }> {
    return { data: this.defaultIngestion(source), meta: { mode: 'fixture', durationMs: 0 } };
  }

  async chat(
    _systemPrompt: string,
    _userContent: string,
    _responseSchema: unknown,
  ): Promise<{ content: unknown; meta: AiMeta }> {
    return { content: this.defaultDebateResult(), meta: { mode: 'fixture', durationMs: 0 } };
  }

  private defaultIngestion(source: 'jira' | 'git' | 'hrms'): unknown {
    if (source === 'jira') {
      return {
        velocityAnalysis: {
          teamVelocityIndex: 0.78,
          overallOverrunRatio: 1.15,
          sprintBreakdown: [],
          totalEstimatedPoints: 300,
          totalActualPoints: 345,
        },
        developerContributions: [],
        labelOverrunAnalysis: [],
        insights: ['Fixture data — configure GEMINI_API_KEY for live AI analysis'],
      };
    }
    if (source === 'git') {
      return {
        complexityReport: { overallComplexityScore: 6.5, breakdown: {} },
        dependencyRiskAssessment: [],
        migrationReadiness: { score: 5, blockers: [], enablers: [], estimatedRefactorWeeks: 8 },
        gitInferredSkills: [],
      };
    }
    return {
      skillCoverageMatrix: {},
      teamComposition: { headcount: 12, byDepartment: {}, byCostBand: {}, avgTenureYears: 3.8 },
      migrationTeamRecommendation: { recommendedLead: 'unknown', coreTeam: [], rationale: 'Fixture data' },
      riskFlags: [],
    };
  }

  defaultDebateResult(): unknown {
    return {
      frictionFactor: 1.2,
      confidenceScore: 0.5,
      keyRisks: [
        {
          risk: 'Fixture data — configure GEMINI_API_KEY for live AI analysis',
          severity: 'low',
          sourceAgent: 'Researcher',
          evidence: 'No live AI analysis available',
        },
      ],
      debateLog: [
        {
          round: 1,
          agent: 'Synthesizer',
          position: 'neutral',
          argument: 'Fixture debate result — no Gemini API key configured',
          evidenceCited: [],
        },
      ],
    };
  }
}
