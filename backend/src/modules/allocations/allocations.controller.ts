import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllocationsService } from './allocations.service';
import { AllocationDto, AllocationQueryDto, BulkAllocationDto } from './dto/allocation.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('allocations')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('allocations')
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Get()
  @RequirePermissions(Permissions.ALLOCATIONS_READ)
  @ApiOperation({ summary: 'Current allocations for tenant, optionally filtered by scenario' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: AllocationQueryDto) {
    return this.allocationsService.findAll(tenantId, query.scenarioExternalId);
  }

  @Post()
  @RequirePermissions(Permissions.ALLOCATIONS_WRITE)
  @ApiOperation({ summary: 'Upsert a developer allocation; validates ≤100% total per dev' })
  upsertOne(@CurrentTenant() tenantId: string, @Body() dto: AllocationDto) {
    return this.allocationsService.upsertOne(tenantId, dto);
  }

  @Post('bulk')
  @RequirePermissions(Permissions.ALLOCATIONS_WRITE)
  @ApiOperation({ summary: 'Bulk-upsert allocations; each item validated independently' })
  upsertBulk(@CurrentTenant() tenantId: string, @Body() dto: BulkAllocationDto) {
    return this.allocationsService.upsertBulk(tenantId, dto.allocations);
  }

  @Delete('scenario/:scenarioExternalId')
  @RequirePermissions(Permissions.ALLOCATIONS_WRITE)
  @ApiOperation({ summary: 'Reset all allocations for a scenario' })
  removeByScenario(
    @CurrentTenant() tenantId: string,
    @Param('scenarioExternalId') scenarioExternalId: string,
  ) {
    return this.allocationsService.removeByScenario(tenantId, scenarioExternalId);
  }

  @Delete(':scenarioExternalId/:devPseudonym')
  @RequirePermissions(Permissions.ALLOCATIONS_WRITE)
  @ApiOperation({ summary: 'Remove a single dev allocation from a scenario' })
  removeOne(
    @CurrentTenant() tenantId: string,
    @Param('scenarioExternalId') scenarioExternalId: string,
    @Param('devPseudonym') devPseudonym: string,
  ) {
    return this.allocationsService.removeOne(tenantId, scenarioExternalId, devPseudonym);
  }
}
