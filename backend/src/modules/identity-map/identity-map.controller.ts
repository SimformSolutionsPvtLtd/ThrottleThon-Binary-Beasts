import { Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { AuthUser } from '../../common/types/auth-user';
import { IdentityMapService } from './identity-map.service';

@ApiTags('identity-map')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('identity-map')
export class IdentityMapController {
  constructor(private readonly identityMapService: IdentityMapService) {}

  @Get()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RequirePermissions(Permissions.IDENTITY_MAP_READ)
  @ApiOperation({ summary: 'Get full pseudonym→identity map', description: 'Returns all pseudonym→{realName,email} entries for the tenant. Requires identity-map:read. Every access is audit-logged.' })
  @ApiResponse({ status: 200, description: 'Full identity map returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getFullMap(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket?.remoteAddress;
    return this.identityMapService.getFullMap(tenantId, user, ip);
  }

  @Get(':pseudonym')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RequirePermissions(Permissions.IDENTITY_MAP_READ)
  @ApiOperation({ summary: 'Get identity for a single pseudonym', description: 'Returns realName and email for the given pseudonym. Requires identity-map:read. Every access is audit-logged.' })
  @ApiParam({ name: 'pseudonym', example: 'DEV_01' })
  @ApiResponse({ status: 200, description: 'Identity entry returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Pseudonym not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getByPseudonym(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('pseudonym') pseudonym: string,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket?.remoteAddress;
    const result = await this.identityMapService.getByPseudonym(tenantId, pseudonym, user, ip);
    if (!result) throw new NotFoundException(`Pseudonym '${pseudonym}' not found`);
    return result;
  }
}
