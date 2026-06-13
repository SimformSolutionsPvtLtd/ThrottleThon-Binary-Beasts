import { z } from 'zod';

export const JiraIngestionSchema = z.object({
  velocityAnalysis: z.object({
    teamVelocityIndex: z.number(),
    overallOverrunRatio: z.number(),
    sprintBreakdown: z.array(
      z.object({
        sprint: z.string(),
        estimatedPoints: z.number(),
        actualPoints: z.number(),
        overrunRatio: z.number(),
      }),
    ),
    totalEstimatedPoints: z.number(),
    totalActualPoints: z.number(),
  }),
  developerContributions: z.array(
    z.object({
      pseudonym: z.string(),
      ticketsCompleted: z.number(),
      totalEstimated: z.number(),
      totalActual: z.number(),
      personalOverrunRatio: z.number(),
      topLabels: z.array(z.string()),
    }),
  ),
  labelOverrunAnalysis: z.array(
    z.object({
      label: z.string(),
      ticketCount: z.number(),
      totalEstimated: z.number(),
      totalActual: z.number(),
      overrunRatio: z.number(),
    }),
  ),
  insights: z.array(z.string()),
});

export type JiraIngestion = z.infer<typeof JiraIngestionSchema>;
