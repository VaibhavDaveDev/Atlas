import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsOptional, IsInt, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 30,
    description: "Number of days to retain notifications",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  notificationRetentionDays?: number;
}
