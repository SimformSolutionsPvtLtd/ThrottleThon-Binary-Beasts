export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AIRequestInput {
  prompt: string;
  schema?: unknown;
  temperature?: number;
  maxTokens?: number;
  purpose?: string;
}

export interface AIResponse<T = unknown> {
  output: T;
  raw: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  finishReason?: string;
}

export interface DebatePrompt {
  scenarioName: string;
  assumptions: Record<string, unknown>;
  baseline: Record<string, number>;
}

export interface ForecastInsightInput {
  scenarioName: string;
  metrics: Record<string, number>;
}

export interface AIProvider {
  generateStructuredResponse<T = unknown>(input: AIRequestInput): Promise<AIResponse<T>>;
  generateDebate(input: DebatePrompt): Promise<AIResponse<unknown>>;
  generateForecastInsights(input: ForecastInsightInput): Promise<AIResponse<unknown>>;
}
