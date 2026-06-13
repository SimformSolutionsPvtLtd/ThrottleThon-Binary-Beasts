import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ForecastService } from './forecast.service';
import { RunForecastDto } from './dto/run-forecast.dto';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

@ApiBearerAuth()
@ApiTags('forecast')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecast: ForecastService) {}

  @Post()
  @Permissions(Permission.FORECAST_RUN)
  run(@Body() dto: RunForecastDto) {
    return this.forecast.run(dto);
  }
}
