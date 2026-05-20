import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ example: 'HR Manager', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Manages all HR related tasks', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
