import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token",
  })
  @IsString()
  @IsNotEmpty({ message: "Refresh token is required" })
  refreshToken: string;

  @ApiProperty({
    example: "uuid-of-workspace",
    description: "Current workspace context to preserve",
    required: false,
  })
  @IsString()
  @IsOptional()
  workspaceId?: string;
}
