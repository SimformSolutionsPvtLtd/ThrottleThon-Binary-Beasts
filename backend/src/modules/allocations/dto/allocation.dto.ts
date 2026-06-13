import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class AllocationDto {
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

export class BulkAllocationDto {
  @ApiProperty({ type: [AllocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations!: AllocationDto[];
}

export class AllocationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scenarioExternalId?: string;
}
