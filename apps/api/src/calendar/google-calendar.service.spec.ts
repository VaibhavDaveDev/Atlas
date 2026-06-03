import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { GoogleCalendarService } from "./google-calendar.service";
import { PrismaService } from "../common/services/prisma.service";
import { google } from "googleapis";

vi.mock("googleapis", () => {
  const insertMock = vi.fn();
  const setCredentialsMock = vi.fn();
  const refreshAccessTokenMock = vi.fn();

  class MockOAuth2 {
    setCredentials = setCredentialsMock;
    refreshAccessToken = refreshAccessTokenMock;
  }

  return {
    google: {
      auth: {
        OAuth2: MockOAuth2,
      },
      calendar: vi.fn().mockReturnValue({
        events: {
          insert: insertMock,
        },
      }),
    },
  };
});

describe("GoogleCalendarService", () => {
  let service: GoogleCalendarService;
  let mockPrismaService: any;
  let oauth2Instance: any;
  let insertMock: any;
  let setCredentialsMock: any;
  let refreshAccessTokenMock: any;

  beforeEach(async () => {
    mockPrismaService = {
      account: {
        findFirst: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      authUser: {
        findUnique: vi.fn(),
      },
      companyEvent: {
        findMany: vi.fn(),
      },
      holiday: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GoogleCalendarService>(GoogleCalendarService);

    // Get the mocked methods from googleapis
    oauth2Instance = new google.auth.OAuth2();
    setCredentialsMock = oauth2Instance.setCredentials;
    refreshAccessTokenMock = oauth2Instance.refreshAccessToken;

    const calendarInstance = google.calendar({
      version: "v3",
      auth: oauth2Instance,
    });
    insertMock = calendarInstance.events.insert;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("pushEventToUser", () => {
    it("should return false if user has no linked Google account", async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      const result = await service.pushEventToUser("user-1", {
        title: "Test Event",
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toBe(false);
      expect(mockPrismaService.account.findFirst).toHaveBeenCalledWith({
        where: { userId: "user-1", providerId: "google" },
      });
    });

    it("should refresh token if expired and push event successfully", async () => {
      // Mock an expired token
      const expiredDate = new Date(Date.now() - 10000); // 10 seconds ago
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: "account-1",
        accessToken: "old-access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresAt: expiredDate,
      });

      refreshAccessTokenMock.mockResolvedValue({
        credentials: {
          access_token: "new-access-token",
          expiry_date: Date.now() + 3600000, // 1 hour from now
        },
      });

      insertMock.mockResolvedValue({ data: { id: "event-1" } });

      const event = {
        title: "Test Event",
        startDate: new Date(),
        endDate: new Date(),
      };

      const result = await service.pushEventToUser("user-1", event);

      expect(result).toBe(true);
      expect(refreshAccessTokenMock).toHaveBeenCalled();
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: "account-1" },
        data: expect.objectContaining({
          accessToken: "new-access-token",
        }),
      });
      expect(insertMock).toHaveBeenCalled();
    });

    it("should return false if push fails", async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: "account-1",
        accessToken: "valid-access-token",
        refreshToken: "refresh-token",
        accessTokenExpiresAt: new Date(Date.now() + 3600000), // Valid for 1 hr
      });

      insertMock.mockRejectedValue(new Error("API Error"));

      const result = await service.pushEventToUser("user-1", {
        title: "Test Event",
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toBe(false);
    });
  });

  describe("fanOutEvent", () => {
    it("should fan out event to all linked accounts and return stats", async () => {
      mockPrismaService.account.findMany.mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
        { userId: "user-3" }, // We will mock this one to fail
      ]);

      // Mock pushEventToUser via spy
      const pushSpy = vi.spyOn(service, "pushEventToUser");
      pushSpy.mockImplementation(async (userId) => {
        return userId !== "user-3"; // user-3 fails
      });

      const result = await service.fanOutEvent("workspace-1", {
        title: "Company Meeting",
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toEqual({ total: 3, succeeded: 2, failed: 1 });
      expect(pushSpy).toHaveBeenCalledTimes(3);
    });
  });
});
