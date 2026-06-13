import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { TicketsQueryDto } from './dto/tickets-query.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @RequirePermissions(Permissions.INGESTION_READ)
  @ApiOperation({ summary: 'Paginated list of Jira tickets for the current tenant' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: TicketsQueryDto) {
    return this.ticketsService.findAll(tenantId, query);
  }

  @Get('stats')
  @RequirePermissions(Permissions.INGESTION_READ)
  @ApiOperation({ summary: 'Aggregated ticket stats: overrun ratios, label breakdown' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.ticketsService.getStats(tenantId);
  }
}
