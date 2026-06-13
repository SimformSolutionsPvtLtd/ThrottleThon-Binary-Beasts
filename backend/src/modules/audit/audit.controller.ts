import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Permissions } from '../../common/decorators/roles.decorator';
import { Permission } from '../../common/constants/roles.enum';

@ApiBearerAuth()
@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Permissions(Permission.AUDIT_READ)
  list(@Query('entity') entity?: string, @Query('entityId') entityId?: string) {
    return this.audit.list(entity, entityId);
  }
}
