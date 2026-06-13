import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

@ApiBearerAuth()
@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @Permissions(Permission.PROJECT_READ)
  findAll() {
    return this.projects.findAll();
  }

  @Get(':id')
  @Permissions(Permission.PROJECT_READ)
  findOne(@Param('id') id: string) {
    return this.projects.findById(id);
  }

  @Post()
  @Permissions(Permission.PROJECT_WRITE)
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }
}
