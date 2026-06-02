import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SelectWorkspaceDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Workspace ID to select",
  })
  @IsUUID("7", { message: "Please provide a valid workspace ID" })
  workspaceId: string;
}
