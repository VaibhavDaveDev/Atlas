import { IsArray, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserPermissionsDto {
  @ApiProperty({ type: [String], example: ["uuid-of-permission-1"] })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
