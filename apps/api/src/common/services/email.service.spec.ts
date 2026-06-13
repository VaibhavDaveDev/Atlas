import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "./email.service";
import { CustomLoggerService } from "./custom-logger.service";
import config from "../config/app.config";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("EmailService (atlas-mailer integration)", () => {
  let service: EmailService;
  let customLogger: CustomLoggerService;

  beforeEach(async () => {
    const mockLogger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    customLogger = module.get<CustomLoggerService>(CustomLoggerService);

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should send email via atlas-mailer when configured", async () => {
    // Setup config for atlas-mailer
    const originalProvider = config.email_provider;
    const originalUrl = config.atlas_mailer_url;
    const originalKey = config.atlas_mailer_api_key;

    (config as any).email_provider = "atlas-mailer";
    (config as any).atlas_mailer_url = "https://mailer.test";
    (config as any).atlas_mailer_api_key = "test-api-key";

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, messageId: "123" }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const emailOptions = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test Content</p>",
    };

    await service.sendEmail(emailOptions);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://mailer.test/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "test@example.com",
          subject: "Test Subject",
          text: undefined,
          html: "<p>Test Content</p>",
        }),
      }),
    );

    // Restore config
    (config as any).email_provider = originalProvider;
    (config as any).atlas_mailer_url = originalUrl;
    (config as any).atlas_mailer_api_key = originalKey;
  });

  it("should throw error if atlas-mailer response is not ok", async () => {
    (config as any).email_provider = "atlas-mailer";
    (config as any).atlas_mailer_url = "https://mailer.test";
    (config as any).atlas_mailer_api_key = "test-api-key";

    const mockResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({ success: false, error: "Internal Server Error" }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await expect(service.sendEmail({
      to: "test@example.com",
      subject: "Test",
    })).rejects.toThrow("Internal Server Error");
  });
});
