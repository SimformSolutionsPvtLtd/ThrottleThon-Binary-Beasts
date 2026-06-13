import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodError } from 'zod';
import { ForecastService } from './forecast.service';
import { ForecastRequestDto, ForecastRequestSchema } from './dto/forecast-request.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('forecast')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Post()
  @HttpCode(200)
  @RequirePermissions(Permissions.FORECAST_READ)
  @ApiOperation({ summary: 'Deterministic forecast for 1–5 scenarios (<100ms, no AI)' })
  async forecast(@CurrentTenant() tenantId: string, @Body() dto: ForecastRequestDto) {
    try {
      ForecastRequestSchema.parse(dto);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.errors);
      }
      throw e;
    }
    return this.forecastService.runForecast(tenantId, dto);
  }
}
