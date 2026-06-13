import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

@ApiBearerAuth()
@ApiTags('scenarios')
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  @Permissions(Permission.SCENARIO_READ)
  findAll(@Query('projectId') projectId?: string) {
    return this.scenarios.findAll(projectId);
  }

  @Get(':id')
  @Permissions(Permission.SCENARIO_READ)
  findOne(@Param('id') id: string) {
    return this.scenarios.findById(id);
  }

  @Post()
  @Permissions(Permission.SCENARIO_WRITE)
  create(@Body() dto: CreateScenarioDto, @CurrentUser() user: AuthUser) {
    return this.scenarios.create(dto, user.id);
  }
}
