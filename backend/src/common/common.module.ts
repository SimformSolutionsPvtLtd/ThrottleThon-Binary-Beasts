import { Global, Module } from '@nestjs/common';
import { PiiSanitiserService } from './services/pii-sanitiser.service';
import { AuditLogService } from './services/audit-log.service';

@Global()
@Module({
  providers: [PiiSanitiserService, AuditLogService],
  exports: [PiiSanitiserService, AuditLogService],
})
export class CommonModule {}
