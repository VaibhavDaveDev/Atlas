import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutAllDto {
  @ApiProperty({
    example: '0186e1a0-1c2b-7f00-8000-000000000001',
    description: 'User ID to logout from all devices',
  })
  @IsUUID('7', { message: 'Please provide a valid user ID' })
  userId: string;
}