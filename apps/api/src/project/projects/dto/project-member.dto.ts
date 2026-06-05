import { IsNotEmpty, IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ProjectRole } from "@atlas/database";

export class AssignProjectMemberDto {
  @ApiProperty({ description: "Employee ID to assign" })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: "Role within the project", enum: ProjectRole })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ description: "Role within the project", enum: ProjectRole })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role: ProjectRole;
}
