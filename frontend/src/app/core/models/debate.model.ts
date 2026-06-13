export interface DebateResult {
  scenarioExternalId: string;
  frictionFactor: number;
  confidenceScore: number;
  keyRisks: KeyRisk[];
  debateLog: DebateEntry[];
  meta: {
    mode: 'live' | 'fixture' | 'cached';
    totalDurationMs: number;
    roundsCompleted: number;
  };
}

export interface KeyRisk {
  risk: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceAgent: string;
  evidence: string;
}

export interface DebateEntry {
  round: number;
  agent: string;
  position: string;
  argument: string;
  evidenceCited: string[];
}

export interface DebateProgress {
  currentAgent: string;
  round: number;
  completedAgents: number;
  totalAgents: number;
}
