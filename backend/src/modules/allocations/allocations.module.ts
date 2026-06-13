import { Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller';
import { AllocationsService } from './allocations.service';
import { ForecastModule } from '../forecast/forecast.module';

@Module({
  imports: [ForecastModule],
  controllers: [AllocationsController],
  providers: [AllocationsService],
})
export class AllocationsModule {}
