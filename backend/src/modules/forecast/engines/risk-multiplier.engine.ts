import { Injectable } from '@nestjs/common';

export interface RiskFactors {
  contingencyPct?: number;
  unknowns?: number; // 0..1
  externalDependencies?: number; // 0..1
  teamChurn?: number; // 0..1
  regulatoryComplexity?: number; // 0..1
}

@Injectable()
export class RiskMultiplierEngine {
  multiplier(factors: RiskFactors): number {
    const contingency = clamp(factors.contingencyPct ?? 0.1, 0, 1);
    const unknowns = clamp(factors.unknowns ?? 0.2, 0, 1) * 0.30;
    const ext = clamp(factors.externalDependencies ?? 0.1, 0, 1) * 0.20;
    const churn = clamp(factors.teamChurn ?? 0.05, 0, 1) * 0.25;
    const reg = clamp(factors.regulatoryComplexity ?? 0, 0, 1) * 0.25;
    return round3(1 + contingency + unknowns + ext + churn + reg);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
