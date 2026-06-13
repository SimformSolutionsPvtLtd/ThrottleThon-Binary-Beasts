export interface Scenario {
  id: string;
  externalId: string;
  name: string;
  description: string;
  category: string;
  baseEffortPoints: number;
  config: ScenarioConfig;
  isActive: boolean;
}

export interface ScenarioConfig {
  riskFactors: string[];
  assumptions: string[];
  applicableLabels: string[];
  expectedOutcome: string;
}
