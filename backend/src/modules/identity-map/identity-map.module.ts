import { Module } from '@nestjs/common';
import { IdentityMapController } from './identity-map.controller';
import { IdentityMapService } from './identity-map.service';

@Module({
  controllers: [IdentityMapController],
  providers: [IdentityMapService],
  exports: [IdentityMapService],
})
export class IdentityMapModule {}
