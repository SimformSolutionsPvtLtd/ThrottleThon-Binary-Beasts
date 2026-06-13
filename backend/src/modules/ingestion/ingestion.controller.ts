import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@UseGuards(TenantGuard)
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('all')
  @RequirePermissions(Permissions.INGESTION_TRIGGER)
  @ApiOperation({ summary: 'Trigger ingestion for all 3 sources in parallel' })
  async ingestAll(@CurrentTenant() tenantId: string) {
    return this.ingestionService.ingestAll(tenantId);
  }

  @Post(':source')
  @RequirePermissions(Permissions.INGESTION_TRIGGER)
  @ApiOperation({ summary: 'Trigger ingestion for a specific source (jira|git|hrms)' })
  async ingest(
    @CurrentTenant() tenantId: string,
    @Param('source') source: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    this.ingestionService.assertValidSource(source);
    return this.ingestionService.ingest(tenantId, source, forceRefresh === 'true');
  }

  @Get(':source/parsed')
  @RequirePermissions(Permissions.INGESTION_READ)
  @ApiOperation({ summary: 'Get cached/fixture parsed ingestion data' })
  @ApiQuery({ name: 'forceRefresh', required: false, type: Boolean })
  async getParsed(
    @CurrentTenant() tenantId: string,
    @Param('source') source: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    this.ingestionService.assertValidSource(source);
    if (forceRefresh === 'true') {
      return this.ingestionService.ingest(tenantId, source, true);
    }
    return this.ingestionService.getParsed(tenantId, source);
  }
}
