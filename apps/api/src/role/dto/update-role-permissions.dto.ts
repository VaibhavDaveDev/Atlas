import { IsArray, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ["uuid-of-permission-1", "uuid-of-permission-2"],
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
