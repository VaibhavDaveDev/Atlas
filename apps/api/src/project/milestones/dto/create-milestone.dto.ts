import { IsString, IsOptional, IsDateString, IsUUID } from "class-validator";

export class CreateMilestoneDto {
  @IsUUID()
  projectId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  targetDate: string;

  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
