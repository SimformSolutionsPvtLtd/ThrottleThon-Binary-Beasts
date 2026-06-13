import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CostBand } from '@prisma/client';

export class CreateDeveloperDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pseudonym!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  tenureYears!: number;

  @ApiProperty({ enum: CostBand })
  @IsEnum(CostBand)
  costBand!: CostBand;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsArray()
  @IsOptional()
  skills?: object[];

  @ApiPropertyOptional({ type: 'object' })
  @IsObject()
  @IsOptional()
  currentAllocation?: object;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
