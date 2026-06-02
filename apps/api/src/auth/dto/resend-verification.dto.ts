import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResendVerificationDto {
  @ApiProperty({
    example: "john.doe@example.com",
    description: "User email address to resend verification code",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;
}
