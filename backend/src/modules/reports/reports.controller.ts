import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

class BriefDto {
  @ApiProperty() @IsUUID() scenarioId!: string;
  @ApiProperty({ enum: ['CEO', 'CFO', 'CTO'] })
  @IsEnum(['CEO', 'CFO', 'CTO'])
  audience!: 'CEO' | 'CFO' | 'CTO';
}

@ApiBearerAuth()
@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('brief')
  @Permissions(Permission.REPORT_GENERATE)
  brief(@Body() dto: BriefDto, @CurrentUser() user: AuthUser) {
    return this.reports.brief(dto, user.id);
  }
}
