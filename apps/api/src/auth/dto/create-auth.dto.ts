import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAuthDto {
  @ApiProperty({
    example: "johndoe",
    description: "Username (alphanumeric, underscores, hyphens only)",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: "Username must be at least 3 characters" })
  @MaxLength(50, { message: "Username must not exceed 50 characters" })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Username can only contain letters, numbers, underscores, and hyphens",
  })
  username: string;

  @ApiProperty({
    example: "Password@123",
    description: "Password (min 8 chars, max 128 chars)",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128, { message: "Password must not exceed 128 characters" })
  password: string;

  @ApiProperty({
    example: "john@example.com",
    description: "Valid email address",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty()
  @MaxLength(255, { message: "Email must not exceed 255 characters" })
  email: string;
}
