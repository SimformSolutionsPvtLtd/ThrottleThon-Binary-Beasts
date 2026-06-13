import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Permissions } from '../../common/constants/permissions';
import { AgentHubService } from './agent-hub.service';
import { DebateService } from './debate.service';
import { RunDebateDto } from './dto/run-debate.dto';

@ApiTags('debate')
@UseGuards(TenantGuard)
@Controller('api/v1/debate')
export class DebateController {
  constructor(
    private readonly agentHub: AgentHubService,
    private readonly debateService: DebateService,
  ) {}

  @Post()
  @HttpCode(200)
  @RequirePermissions(Permissions.DEBATE_RUN)
  @ApiOperation({ summary: 'Run adversarial 4-agent debate for one or more scenarios' })
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
