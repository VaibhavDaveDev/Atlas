import { Injectable } from "@nestjs/common";
import { RedisService } from "../../common/services/redis.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";

@Injectable()
export class ExchangeRateService {
  private readonly baseUrl = "https://api.frankfurter.dev/v2";

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  /**
   * Fetches the exchange rate between base and quote currencies.
   * @param base The base currency code (e.g., 'USD')
   * @param quote The quote currency code (e.g., 'EUR')
   * @param date Optional date in YYYY-MM-DD format. If omitted, latest rate is used.
   */
  async getExchangeRate(
    base: string,
    quote: string,
    date?: string,
  ): Promise<number> {
    if (base === quote) return 1.0;

    const cacheKey = `exchange_rate:${base}:${quote}:${date || "latest"}`;

    try {
      const cachedRate = (await this.redisService.get(cacheKey)) as string;
      if (cachedRate) {
        return parseFloat(cachedRate);
      }
    } catch (e) {
      this.logger.warn(
        `Redis cache fetch failed for ${cacheKey}: ${e.message}`,
        "ExchangeRateService",
      );
    }

    try {
      let url = `${this.baseUrl}/rate/${base}/${quote}`;
      if (date) {
        url += `?date=${date}`;
      }

      this.logger.log(
        `Fetching exchange rate from ${url}`,
        "ExchangeRateService",
      );

      const response = await fetch(url);

      if (response.status === 404) {
        throw new Error(
          `Exchange rate data not found for ${base}/${quote} on ${date || "latest"}`,
        );
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Frankfurter API error (${response.status}): ${errorBody}`,
        );
      }

      const data = (await response.json()) as {
        rate: number;
        date: string;
        base: string;
        quote: string;
      };
      const rate = data.rate;

      if (rate !== undefined && rate !== null) {
        // Cache for 24 hours if it's a specific date, or 4 hours if it's latest
        const ttl = date ? 86400 : 14400;
        try {
          await this.redisService.set(cacheKey, rate.toString(), ttl);
        } catch (e) {
          this.logger.warn(
            `Redis cache set failed for ${cacheKey}: ${e.message}`,
            "ExchangeRateService",
          );
        }
        return rate;
      }

      throw new Error(`Rate property missing in API response for ${quote}`);
    } catch (error) {
      this.logger.error(
        `Failed to fetch exchange rate: ${error.message}`,
        error.stack,
        "ExchangeRateService",
      );
      throw error;
    }
  }

  /**
   * List all available currencies from Frankfurter API.
   */
  async getCurrencies(): Promise<Record<string, string>> {
    const cacheKey = "exchange_currencies";

    try {
      const cached = (await this.redisService.get(cacheKey)) as string;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const data: Record<string, string> = {};
          parsed.forEach((c: any) => {
            data[c.iso_code || c.code] = c.name;
          });
          return data;
        }
        return parsed as Record<string, string>;
      }
    } catch (e) {}

    try {
      const response = await fetch(`${this.baseUrl}/currencies`);
      if (!response.ok)
        throw new Error(`Failed to fetch currencies: ${response.statusText}`);

      const rawData = await response.json();
      const data: Record<string, string> = {};

      if (Array.isArray(rawData)) {
        rawData.forEach((c: any) => {
          data[c.iso_code || c.code] = c.name;
        });
      } else {
        Object.assign(data, rawData);
      }

      await this.redisService.set(cacheKey, JSON.stringify(data), 86400); // Cache for 1 day
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch currencies: ${error.message}`,
        error.stack,
        "ExchangeRateService",
      );
      throw error;
    }
  }
}
