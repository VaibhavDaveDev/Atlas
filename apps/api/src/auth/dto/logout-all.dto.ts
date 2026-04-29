import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutAllDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID to logout from all devices',
  })
  @IsUUID('4', { message: 'Please provide a valid user ID' })
  userId: string;
}