import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@vectorfin.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'changeme' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'vectorfin' })
  @IsString()
  @MinLength(1)
  tenantSlug!: string;
}
