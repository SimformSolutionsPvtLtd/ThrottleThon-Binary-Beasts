import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateAllocationDto {
  @ApiProperty() @IsUUID() developerId!: string;
  @ApiProperty() @IsUUID() scenarioId!: string;
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  allocationPercent!: number;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiProperty() @IsDateString() endDate!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
