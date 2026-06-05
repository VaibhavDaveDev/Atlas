import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsUUID,
} from "class-validator";
import { ProjectStatus } from "@atlas/database";

export class CreateProjectDto {
  @IsString()
  projectCode: string;

  @IsString()
  projectName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsUUID()
  projectManagerId?: string;

  @IsOptional()
  @IsNumber()
  budgetAmount?: number;
}
