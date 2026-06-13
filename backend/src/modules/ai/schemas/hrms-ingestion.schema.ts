import { z } from 'zod';

export const HrmsIngestionSchema = z.object({
  skillCoverageMatrix: z.record(z.unknown()),
  teamComposition: z.record(z.unknown()),
  migrationTeamRecommendation: z.record(z.unknown()),
  riskFlags: z.array(z.unknown()),
});

export type HrmsIngestion = z.infer<typeof HrmsIngestionSchema>;
