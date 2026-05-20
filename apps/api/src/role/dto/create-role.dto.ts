import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'HR Manager' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Manages all HR related tasks', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
