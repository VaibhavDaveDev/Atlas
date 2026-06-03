import { Test, TestingModule } from "@nestjs/testing";
import { ExchangeRateService } from "./exchange-rates.service";
import { RedisService } from "../../common/services/redis.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";

describe("ExchangeRateService", () => {
  let service: ExchangeRateService;
  let redisService: RedisService;

  const mockRedisService = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockLogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
    redisService = module.get<RedisService>(RedisService);
  });

  it("should return 1.0 if base and quote are same", async () => {
    const rate = await service.getExchangeRate("USD", "USD");
    expect(rate).toBe(1.0);
  });

  it("should return cached rate if available", async () => {
    mockRedisService.get.mockResolvedValue("0.85");
    const rate = await service.getExchangeRate("USD", "EUR");
    expect(rate).toBe(0.85);
    expect(mockRedisService.get).toHaveBeenCalled();
  });

  it("should fetch from API and cache if not in redis", async () => {
    mockRedisService.get.mockResolvedValue(null);

    // Mock global fetch
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          rate: 0.92,
          base: "USD",
          quote: "EUR",
          date: "2023-01-01",
        }),
    };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const rate = await service.getExchangeRate("USD", "EUR", "2023-01-01");

    expect(rate).toBe(0.92);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/rate/USD/EUR?date=2023-01-01",
    );
    expect(mockRedisService.set).toHaveBeenCalled();
  });
});
