import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTimeLogDto {
  @ApiProperty({ description: "Number of hours worked" })
  @IsNumber()
  @Min(0.1)
  @IsNotEmpty()
  hours: number;

  @ApiProperty({ description: "Description of the work done", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Date of the work", example: "2024-06-04" })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
