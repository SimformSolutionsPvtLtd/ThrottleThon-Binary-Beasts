import { Injectable } from '@nestjs/common';

export interface TimelineInput {
  scopeStoryPoints: number;
  velocityPerSprint: number;
  sprintLengthDays: number;
  parallelTeams?: number;
}

@Injectable()
export class TimelineCalculator {
  estimateDays(input: TimelineInput): number {
    const parallel = Math.max(1, input.parallelTeams ?? 1);
    const effectiveVelocity = input.velocityPerSprint * parallel;
    if (effectiveVelocity <= 0) return Number.POSITIVE_INFINITY;
    const sprints = Math.ceil(input.scopeStoryPoints / effectiveVelocity);
    return sprints * input.sprintLengthDays;
  }
}
