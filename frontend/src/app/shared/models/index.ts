export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
}

export interface Scenario {
  id: string;
  projectId: string;
  name: string;
  category: 'BASELINE' | 'AGGRESSIVE' | 'CONSERVATIVE' | 'RISK_ADJUSTED' | 'CUSTOM';
  assumptions: Record<string, unknown>;
  createdAt: string;
}

export interface Forecast {
  id: string;
  scenarioId: string;
  timelineDays: number;
  cost: number;
  riskAdjustedCost: number;
  confidence: number;
}
