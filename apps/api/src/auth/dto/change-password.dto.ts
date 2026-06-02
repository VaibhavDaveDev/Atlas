import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "OldPassword123!", required: false })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ example: "NewPassword123!" })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ example: "123456" })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  otp: string;
}
