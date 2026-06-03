import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { AccountType } from "@atlas/database";

export class CreateAccountDto {
  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @IsUUID()
  parentAccountId?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}
