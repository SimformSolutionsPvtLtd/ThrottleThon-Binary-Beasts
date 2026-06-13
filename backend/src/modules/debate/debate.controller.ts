import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { AgentHubService } from './agent-hub.service';
import { DebateService } from './debate.service';
import { RunDebateDto } from './dto/run-debate.dto';

@ApiTags('debate')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('debate')
export class DebateController {
  constructor(
    private readonly agentHub: AgentHubService,
    private readonly debateService: DebateService,
  ) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RequirePermissions(Permissions.DEBATE_RUN)
  @ApiOperation({ summary: 'Run adversarial 4-agent debate for one or more scenarios', description: 'Orchestrates 7 sequential AI agent calls (2 rounds + synthesis). Rate-limited to 5/min.' })
  @ApiBody({ type: RunDebateDto })
  @ApiResponse({ status: 200, description: 'Debate results per scenario' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 429, description: 'Too many requests — max 5/min' })
  async runDebate(@CurrentTenant() tenantId: string, @Body() dto: RunDebateDto) {
    const results = await Promise.all(
      dto.scenarioExternalIds.map(async (scenarioExternalId) => {
        const { result, meta } = await this.agentHub.runDebate(tenantId, scenarioExternalId);
        const saved = await this.debateService.saveResult(tenantId, scenarioExternalId, result, meta.mode === 'fixture');
        return {
          scenarioExternalId,
          frictionFactor: saved.frictionFactor,
          confidenceScore: saved.confidenceScore,
          keyRisks: saved.keyRisks,
          debateLog: saved.debateLog,
          meta: {
            mode: meta.mode,
            totalDurationMs: meta.totalDurationMs,
            roundsCompleted: meta.roundsCompleted,
          },
        };
      }),
    );
    return results;
  }

  @Get(':scenarioExternalId')
  @RequirePermissions(Permissions.DEBATE_READ)
  @ApiOperation({ summary: 'Get the latest debate result for a scenario' })
  @ApiParam({ name: 'scenarioExternalId', example: 'angular-migration-full' })
  @ApiResponse({ status: 200, description: 'Latest debate result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'No debate result found for scenario' })
  async getDebate(@CurrentTenant() tenantId: string, @Param('scenarioExternalId') scenarioExternalId: string) {
    const result = await this.debateService.getLatest(tenantId, scenarioExternalId);
    return {
      scenarioExternalId: result.scenarioExternalId,
      frictionFactor: result.frictionFactor,
      confidenceScore: result.confidenceScore,
      keyRisks: result.keyRisks,
      debateLog: result.debateLog,
      meta: {
        mode: result.isFixture ? 'fixture' : 'live',
        createdAt: result.createdAt,
      },
    };
  }
}
