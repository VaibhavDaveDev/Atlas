import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
} from "class-validator";
import { PaymentType } from "@atlas/database";

export class CreatePaymentDto {
  @IsString()
  paymentNumber: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsDateString()
  paymentDate: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsString()
  accountId: string; // The Bank/Cash account for the payment

  @IsOptional()
  @IsString()
  offsetAccountId?: string; // Optional custom offsetting account
}
