import { z } from 'zod';

export const GitIngestionSchema = z.object({
  complexityReport: z.object({
    overallComplexityScore: z.number(),
    breakdown: z.record(z.unknown()),
  }),
  dependencyRiskAssessment: z.array(z.unknown()),
  migrationReadiness: z.record(z.unknown()),
  gitInferredSkills: z.array(z.unknown()),
});

export type GitIngestion = z.infer<typeof GitIngestionSchema>;
