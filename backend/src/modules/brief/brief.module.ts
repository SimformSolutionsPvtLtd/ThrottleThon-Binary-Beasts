import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [ForecastModule],
  controllers: [BriefController],
  providers: [BriefService],
})
export class BriefModule {}
