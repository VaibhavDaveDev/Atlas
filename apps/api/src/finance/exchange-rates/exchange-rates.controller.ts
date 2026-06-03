import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ExchangeRateService } from "./exchange-rates.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { WorkspaceGuard } from "../../auth/guards/workspace.guard";

@ApiTags("finance-exchange-rates")
@Controller("finance/exchange-rates")
@UseGuards(AuthGuard, WorkspaceGuard)
@ApiBearerAuth("JWT-auth")
export class ExchangeRatesController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  @ApiOperation({ summary: "Get exchange rate between two currencies" })
  @ApiQuery({ name: "base", required: true, example: "USD" })
  @ApiQuery({ name: "quote", required: true, example: "EUR" })
  @ApiQuery({ name: "date", required: false, example: "2023-01-01" })
  async getRate(
    @Query("base") base: string,
    @Query("quote") quote: string,
    @Query("date") date?: string,
  ): Promise<{ rate: number }> {
    const rate = await this.exchangeRateService.getExchangeRate(
      base,
      quote,
      date,
    );
    return { rate };
  }

  @Get("currencies")
  @ApiOperation({ summary: "List all supported currencies" })
  async getCurrencies(): Promise<Record<string, string>> {
    return this.exchangeRateService.getCurrencies();
  }
}
