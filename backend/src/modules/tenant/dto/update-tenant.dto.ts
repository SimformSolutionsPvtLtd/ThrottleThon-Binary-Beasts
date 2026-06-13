import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsObject, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) brandName?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsHexColor() primaryColor?: string;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
