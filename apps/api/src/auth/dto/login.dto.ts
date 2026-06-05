import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "admin@acme.com",
    description: "User email address",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @ApiProperty({
    example: "Admin@123",
    description: "User password",
  })
  @IsString()
  @MinLength(1, { message: "Password is required" })
  password: string;

  @ApiProperty({
    example: "0.turnstile_token_here",
    description: "Cloudflare Turnstile verification token",
    required: false,
  })
  @IsString()
  @IsOptional()
  turnstileToken?: string;
}
