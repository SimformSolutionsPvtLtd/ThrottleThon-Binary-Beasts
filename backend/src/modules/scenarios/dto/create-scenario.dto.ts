import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ScenarioCategory } from '@prisma/client';

export class CreateScenarioDto {
  @ApiProperty() @IsUUID() projectId!: string;
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty({ enum: ScenarioCategory }) @IsEnum(ScenarioCategory) category!: ScenarioCategory;
  @ApiProperty({ required: false, type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  assumptions?: Record<string, unknown>;
}
