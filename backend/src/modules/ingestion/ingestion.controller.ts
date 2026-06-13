import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('all')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @RequirePermissions(Permissions.INGESTION_TRIGGER)
  @ApiOperation({ summary: 'Trigger ingestion for all 3 sources in parallel' })
  @ApiResponse({ status: 200, description: 'Ingestion results for jira, git, and hrms' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async ingestAll(@CurrentTenant() tenantId: string) {
    return this.ingestionService.ingestAll(tenantId);
  }

  @Post(':source')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @RequirePermissions(Permissions.INGESTION_TRIGGER)
  @ApiOperation({ summary: 'Trigger ingestion for a specific source (jira|git|hrms)' })
  @ApiParam({ name: 'source', enum: ['jira', 'git', 'hrms'] })
  @ApiQuery({ name: 'forceRefresh', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Ingestion result with mode and parsed data' })
  @ApiResponse({ status: 400, description: 'Invalid source' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
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
  @ApiParam({ name: 'source', enum: ['jira', 'git', 'hrms'] })
  @ApiQuery({ name: 'forceRefresh', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Cached ingestion result' })
  @ApiResponse({ status: 400, description: 'Invalid source' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
