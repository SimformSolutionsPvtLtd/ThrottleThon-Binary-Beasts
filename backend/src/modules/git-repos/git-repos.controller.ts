import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GitReposService } from './git-repos.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('git-repos')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('git-repos')
export class GitReposController {
  constructor(private readonly gitReposService: GitReposService) {}

  @Get()
  @RequirePermissions(Permissions.INGESTION_READ)
  @ApiOperation({ summary: 'List all git repositories for the current tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.gitReposService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.INGESTION_READ)
  @ApiOperation({ summary: 'Get a single git repository with full metadata' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.gitReposService.findOne(tenantId, id);
  }
}
