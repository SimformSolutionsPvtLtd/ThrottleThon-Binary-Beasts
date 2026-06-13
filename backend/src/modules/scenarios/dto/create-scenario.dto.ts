import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScenarioConfigDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  riskFactors?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableLabels?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expectedOutcome?: string;
}

export class CreateScenarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  baseEffortPoints!: number;

  @ApiPropertyOptional({ type: ScenarioConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScenarioConfigDto)
  config?: ScenarioConfigDto;
}
