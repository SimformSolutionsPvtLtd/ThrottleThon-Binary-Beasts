export interface AiMeta {
  mode: 'live' | 'fixture' | 'cached';
  durationMs: number;
  tokensUsed?: number;
  model?: string;
}

export interface AiProvider {
  parseIngestion(
    source: 'jira' | 'git' | 'hrms',
    sanitisedData: unknown,
    schema: unknown,
  ): Promise<{ data: unknown; meta: AiMeta }>;
  chat(
    systemPrompt: string,
    userContent: string,
    responseSchema: unknown,
  ): Promise<{ content: unknown; meta: AiMeta }>;
}
