import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class BrandingQueryDto {
  @ApiProperty({ example: 'vectorfin' })
  @IsString()
  @MinLength(1)
  slug!: string;
}
