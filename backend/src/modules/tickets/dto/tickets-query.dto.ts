import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class TicketsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sprint?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  labels?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assigneePseudonym?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
