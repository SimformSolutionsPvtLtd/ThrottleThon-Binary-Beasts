import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DevelopersService } from './developers.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('developers')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Get()
  @RequirePermissions(Permissions.DEVELOPERS_READ)
  @ApiOperation({ summary: 'List all active developers (no PII — pseudonyms only)' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.developersService.findAll(tenantId);
  }

  @Get('bench')
  @RequirePermissions(Permissions.DEVELOPERS_READ)
  @ApiOperation({ summary: 'Developers with available allocation (totalAllocation < 100%)' })
  findBench(@CurrentTenant() tenantId: string) {
    return this.developersService.findBench(tenantId);
  }

  @Get(':pseudonym')
  @RequirePermissions(Permissions.DEVELOPERS_READ)
  @ApiOperation({ summary: 'Get a single developer by pseudonym' })
  findOne(@CurrentTenant() tenantId: string, @Param('pseudonym') pseudonym: string) {
    return this.developersService.findOne(tenantId, pseudonym);
  }

  @Post()
  @RequirePermissions(Permissions.DEVELOPERS_WRITE)
  @ApiOperation({ summary: 'Add a developer' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateDeveloperDto) {
    return this.developersService.create(tenantId, dto);
  }

  @Patch(':pseudonym')
  @RequirePermissions(Permissions.DEVELOPERS_WRITE)
  @ApiOperation({ summary: 'Update a developer' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('pseudonym') pseudonym: string,
    @Body() dto: UpdateDeveloperDto,
  ) {
    return this.developersService.update(tenantId, pseudonym, dto);
  }
}
