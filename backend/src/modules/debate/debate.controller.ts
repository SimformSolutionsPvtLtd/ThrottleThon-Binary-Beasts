import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DebateOrchestrator } from './debate.orchestrator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

class RunDebateDto {
  @ApiProperty() @IsUUID() scenarioId!: string;
}

@ApiBearerAuth()
@ApiTags('debate')
@Controller('debate')
export class DebateController {
  constructor(private readonly orchestrator: DebateOrchestrator) {}

  @Post()
  @Permissions(Permission.DEBATE_RUN)
  run(@Body() dto: RunDebateDto) {
    return this.orchestrator.runForScenario(dto.scenarioId);
  }
}
