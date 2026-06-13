import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @RequirePermissions(Permissions.AUDIT_READ)
  @ApiOperation({ summary: 'Paginated, filterable audit log for the current tenant' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: AuditLogsQueryDto) {
    return this.auditLogService.findAll(tenantId, {
      page: query.page,
      limit: query.limit,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
}
