import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { AuthUser } from '../../common/types/auth-user';
import { BriefService } from './brief.service';
import { BriefRequestDto } from './dto/brief-request.dto';

@ApiTags('brief')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post()
  @HttpCode(200)
  @RequirePermissions(Permissions.BRIEF_GENERATE)
  @ApiOperation({
    summary: 'Generate an executive brief for a scenario',
    description: 'Assembles forecast, debate risks, and team data into a shareable brief. Set includeRealNames=true (requires identity-map:read) to include real developer names.',
  })
  @ApiBody({ type: BriefRequestDto })
  @ApiResponse({ status: 200, description: 'Brief generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (brief:generate or identity-map:read)' })
  @ApiResponse({ status: 404, description: 'Scenario not found' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  async generateBrief(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: BriefRequestDto,
  ) {
    return this.briefService.generate(tenantId, dto, user);
  }
}
