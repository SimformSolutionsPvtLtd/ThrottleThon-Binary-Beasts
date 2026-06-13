import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('status')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  @ApiOperation({ summary: 'Data source status and counts for the current tenant' })
  getStatus(@CurrentTenant() tenantId: string) {
    return this.statusService.getStatus(tenantId);
  }
}
