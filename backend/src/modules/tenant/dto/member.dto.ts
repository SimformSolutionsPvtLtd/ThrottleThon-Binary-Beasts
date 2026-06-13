import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class AddMemberDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ example: 'engineering_manager' }) @IsString() roleName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(8) password?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
}

export class ChangeRoleDto {
  @ApiProperty({ example: 'viewer' }) @IsString() roleName!: string;
}
