import { Injectable } from '@nestjs/common';

export interface DeveloperCost {
  hourlyRate: number;
  allocationPercent: number;
  durationDays: number;
}

@Injectable()
export class CostCalculator {
  private readonly hoursPerDay = 8;

  forDeveloper(input: DeveloperCost): number {
    const hours = input.durationDays * this.hoursPerDay * (input.allocationPercent / 100);
    return round2(hours * input.hourlyRate);
  }

  total(items: DeveloperCost[]): number {
    return round2(items.reduce((sum, i) => sum + this.forDeveloper(i), 0));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
