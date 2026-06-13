import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { TenantService } from './tenant.service';
import { BrandingQueryDto } from './dto/branding-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AddMemberDto, ChangeRoleDto } from './dto/member.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Public()
  @Get('branding')
  @ApiOperation({ summary: 'Public branding for a tenant (white-label pre-login)' })
  @ApiResponse({ status: 200 })
  getBranding(@Query() q: BrandingQueryDto) {
    return this.tenants.getBrandingBySlug(q.slug);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('current')
  @ApiOperation({ summary: 'Current tenant details' })
  getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenants.getCurrent(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Patch('current')
  @RequirePermissions(Permissions.TENANT_MANAGE)
  @ApiOperation({ summary: 'Update tenant branding / settings' })
  updateCurrent(@CurrentTenant() tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.updateCurrent(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Get('current/members')
  @RequirePermissions(Permissions.USERS_MANAGE)
  @ApiOperation({ summary: 'List tenant members' })
  listMembers(@CurrentTenant() tenantId: string) {
    return this.tenants.listMembers(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Post('current/members')
  @RequirePermissions(Permissions.USERS_MANAGE)
  @ApiOperation({ summary: 'Invite or add a member to the current tenant' })
  addMember(@CurrentTenant() tenantId: string, @Body() dto: AddMemberDto) {
    return this.tenants.addMember(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Patch('current/members/:userId')
  @RequirePermissions(Permissions.USERS_MANAGE)
  @ApiOperation({ summary: 'Change a member role' })
  changeRole(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.tenants.changeRole(tenantId, userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(TenantGuard)
  @Delete('current/members/:userId')
  @RequirePermissions(Permissions.USERS_MANAGE)
  @ApiOperation({ summary: 'Deactivate a member' })
  deactivateMember(@CurrentTenant() tenantId: string, @Param('userId') userId: string) {
    return this.tenants.deactivateMember(tenantId, userId);
  }
}
