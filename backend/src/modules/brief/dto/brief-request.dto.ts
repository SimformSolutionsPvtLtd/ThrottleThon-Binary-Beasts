import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BriefRequestDto {
  @ApiProperty({ example: 'angular-migration-full', description: 'The scenario externalId to generate a brief for' })
  @IsString()
  scenarioExternalId!: string;

  @ApiPropertyOptional({ example: false, description: 'If true and caller has identity-map:read, real developer names are included' })
  @IsBoolean()
  @IsOptional()
  includeRealNames?: boolean;
}
