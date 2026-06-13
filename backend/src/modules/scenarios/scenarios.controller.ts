import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('scenarios')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get()
  @RequirePermissions(Permissions.SCENARIOS_READ)
  @ApiOperation({ summary: 'List all active scenarios for the current tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.scenariosService.findAll(tenantId);
  }

  @Get(':externalId')
  @RequirePermissions(Permissions.SCENARIOS_READ)
  @ApiOperation({ summary: 'Get a single scenario by externalId' })
  findOne(@CurrentTenant() tenantId: string, @Param('externalId') externalId: string) {
    return this.scenariosService.findOne(tenantId, externalId);
  }

  @Post()
  @RequirePermissions(Permissions.SCENARIOS_WRITE)
  @ApiOperation({ summary: 'Create a new scenario' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(tenantId, dto);
  }

  @Patch(':externalId')
  @RequirePermissions(Permissions.SCENARIOS_WRITE)
  @ApiOperation({ summary: 'Update a scenario' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('externalId') externalId: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.scenariosService.update(tenantId, externalId, dto);
  }

  @Delete(':externalId')
  @RequirePermissions(Permissions.SCENARIOS_WRITE)
  @ApiOperation({ summary: 'Soft-delete a scenario (sets isActive=false)' })
  remove(@CurrentTenant() tenantId: string, @Param('externalId') externalId: string) {
    return this.scenariosService.softDelete(tenantId, externalId);
  }
}
