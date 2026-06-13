import { ForecastResult } from './forecast.model';
import { KeyRisk } from './debate.model';

export interface BriefRequest {
  scenarioExternalId: string;
  includeRealNames?: boolean;
}

export interface BriefData {
  generatedAt: string;
  tenant: {
    name: string;
    brandName: string;
    logoUrl: string | null;
  };
  scenario: {
    name: string;
    description: string;
    category: string;
    externalId: string;
  };
  forecast: ForecastResult;
  team: BriefTeamMember[];
  risks: KeyRisk[];
  debateSummary: string;
  recommendation: { scenarioId: string; reason: string } | null;
}

export interface BriefTeamMember {
  pseudonym: string;
  realName?: string;
  role: string;
  costBand: string;
  allocationPercent: number;
  topSkills: string[];
}
