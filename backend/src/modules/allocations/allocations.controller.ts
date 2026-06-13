import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllocationsService } from './allocations.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

@ApiBearerAuth()
@ApiTags('allocations')
@Controller('allocations')
export class AllocationsController {
  constructor(private readonly allocations: AllocationsService) {}

  @Get()
  @Permissions(Permission.SCENARIO_READ)
  findAll(@Query('scenarioId') scenarioId?: string) {
    return this.allocations.findAll(scenarioId);
  }

  @Post()
  @Permissions(Permission.ALLOCATION_WRITE)
  create(@Body() dto: CreateAllocationDto) {
    return this.allocations.create(dto);
  }
}
