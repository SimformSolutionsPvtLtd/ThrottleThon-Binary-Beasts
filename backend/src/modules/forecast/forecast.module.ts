import { Module } from '@nestjs/common';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { CostCalculator } from './engines/cost-calculator';
import { TimelineCalculator } from './engines/timeline-calculator';
import { RiskMultiplierEngine } from './engines/risk-multiplier.engine';
import { ScenarioEngine } from './engines/scenario.engine';

@Module({
  controllers: [ForecastController],
  providers: [
    ForecastService,
    CostCalculator,
    TimelineCalculator,
    RiskMultiplierEngine,
    ScenarioEngine,
  ],
  exports: [ForecastService],
})
export class ForecastModule {}
