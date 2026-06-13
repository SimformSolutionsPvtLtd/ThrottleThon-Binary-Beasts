import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { z } from 'zod';

export const ForecastRequestSchema = z.object({
  scenarioIds: z.array(z.string().min(1)).min(1).max(5),
  priorityPressure: z.number().min(0.5).max(2.0),
  scopePercent: z.number().min(50).max(150),
  contingencyBuffer: z.number().min(0).max(0.3),
  allocations: z.array(
    z.object({
      devPseudonym: z.string().min(1),
      scenarioExternalId: z.string().min(1),
      allocationPercent: z.number().int().min(1).max(100),
    }),
  ),
});

export class ForecastAllocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  devPseudonym!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  scenarioExternalId!: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  allocationPercent!: number;
}

export class ForecastRequestDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 5 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  scenarioIds!: string[];

  @ApiProperty({ minimum: 0.5, maximum: 2.0 })
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  priorityPressure!: number;

  @ApiProperty({ minimum: 50, maximum: 150 })
  @IsNumber()
  @Min(50)
  @Max(150)
  scopePercent!: number;

  @ApiProperty({ minimum: 0, maximum: 0.3 })
  @IsNumber()
  @Min(0)
  @Max(0.3)
  contingencyBuffer!: number;

  @ApiProperty({ type: [ForecastAllocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastAllocationDto)
  allocations!: ForecastAllocationDto[];
}
