import { z } from 'zod';

export const AgentOutputSchema = z.object({
  position: z.string(),
  argument: z.string(),
  evidenceCited: z.array(z.string()),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;
