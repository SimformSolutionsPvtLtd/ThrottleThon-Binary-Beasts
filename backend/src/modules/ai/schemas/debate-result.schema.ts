import { z } from 'zod';

export const DebateResultSchema = z.object({
  frictionFactor: z.number().min(0.5).max(5.0),
  confidenceScore: z.number().min(0).max(1),
  keyRisks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      sourceAgent: z.enum(['Researcher', 'Opposer', 'WorstCase']),
      evidence: z.string(),
    }),
  ),
  debateLog: z.array(
    z.object({
      round: z.number(),
      agent: z.string(),
      position: z.string(),
      argument: z.string(),
      evidenceCited: z.array(z.string()),
    }),
  ),
});

export type DebateResultOutput = z.infer<typeof DebateResultSchema>;
