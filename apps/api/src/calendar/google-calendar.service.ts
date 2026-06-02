import { Injectable, Logger } from "@nestjs/common";
import { google } from "googleapis";
import { PrismaService } from "../common/services/prisma.service";

export interface CalendarSyncResult {
  total: number;
  succeeded: number;
  failed: number;
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a fresh OAuth2 client for a specific user account.
   * Handles token refresh automatically and persists the new access token to DB.
   */
  private async buildOAuth2Client(account: {
    id: string;
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
  }) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.accessTokenExpiresAt?.getTime(),
    });

    // If the access token is expired or will expire within 5 minutes, refresh it
    const expiresAt = account.accessTokenExpiresAt?.getTime() ?? 0;
    const isExpiredOrSoon = Date.now() >= expiresAt - 5 * 60 * 1000;

    if (isExpiredOrSoon && account.refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Persist the refreshed token back to the database
        await this.prisma.account.update({
          where: { id: account.id },
          data: {
            accessToken: credentials.access_token,
            accessTokenExpiresAt: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null,
          },
        });

        this.logger.log(
          `Refreshed Google access token for account ${account.id}`,
        );
      } catch (refreshErr: any) {
        this.logger.error(
          `Failed to refresh Google access token for account ${account.id}: ${refreshErr?.message}`,
          refreshErr?.stack,
        );
        throw new Error(
          `Token refresh failed — user must re-link their Google account: ${refreshErr?.message}`,
        );
      }
    }

    return oauth2Client;
  }

  /**
   * Syncs a single event to a specific user's Google Calendar.
   * Returns true on success, false on failure.
   */
  async pushEventToUser(
    userId: string,
    event: {
      title: string;
      description?: string;
      startDate: Date;
      endDate: Date;
      location?: string;
    },
  ): Promise<boolean> {
    try {
      const account = await this.prisma.account.findFirst({
        where: {
          userId,
          providerId: "google",
        },
      });

      if (!account || !account.accessToken) {
        this.logger.debug(
          `User ${userId} has no linked Google account — skipping calendar push`,
        );
        return false;
      }

      if (!account.refreshToken) {
        this.logger.warn(
          `User ${userId} Google account has no refresh token. ` +
            `They may need to re-link with "offline" access. Attempting with access token only.`,
        );
      }

      const oauth2Client = await this.buildOAuth2Client(account);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.startDate.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: event.endDate.toISOString(),
            timeZone: "UTC",
          },
          reminders: {
            useDefault: true,
          },
        },
      });

      this.logger.log(
        `✅ Pushed event "${event.title}" to user ${userId} Google Calendar`,
      );
      return true;
    } catch (error: any) {
      const details =
        error?.response?.data?.error ?? error?.message ?? String(error);
      this.logger.error(
        `❌ Failed to push event "${event.title}" to user ${userId} Google Calendar: ${JSON.stringify(details)}`,
        error?.stack,
      );
      return false;
    }
  }

  /**
   * Fans out an event to all workspace users who have linked their Google account.
   * Returns a sync result summary.
   */
  async fanOutEvent(
    workspaceId: string,
    event: {
      title: string;
      description?: string;
      startDate: Date;
      endDate: Date;
      location?: string;
    },
  ): Promise<CalendarSyncResult> {
    const linkedAccounts = await this.prisma.account.findMany({
      where: {
        providerId: "google",
        user: {
          workspaces: {
            some: { workspaceId },
          },
        },
      },
      select: { userId: true },
    });

    const total = linkedAccounts.length;
    this.logger.log(
      `Fanning out event "${event.title}" to ${total} user(s) in workspace ${workspaceId}`,
    );

    let succeeded = 0;
    let failed = 0;

    for (const account of linkedAccounts) {
      if (!account.userId) {
        failed++;
        continue;
      }
      const ok = await this.pushEventToUser(account.userId, event);
      if (ok) succeeded++;
      else failed++;
    }

    this.logger.log(
      `Fan-out complete for "${event.title}": ${succeeded}/${total} succeeded, ${failed} failed`,
    );

    return { total, succeeded, failed };
  }

  /**
   * Syncs all upcoming company events and holidays to a specific user's Google Calendar.
   * Useful when a user first connects their Google account.
   */
  async syncUpcomingEventsForUser(userId: string): Promise<CalendarSyncResult> {
    const userWithWorkspaces = await this.prisma.authUser.findUnique({
      where: { id: userId },
      include: {
        workspaces: {
          select: { workspaceId: true },
        },
      },
    });

    if (!userWithWorkspaces || userWithWorkspaces.workspaces.length === 0) {
      return { total: 0, succeeded: 0, failed: 0 };
    }

    const workspaceIds = userWithWorkspaces.workspaces.map(
      (w) => w.workspaceId,
    );
    const now = new Date();

    // 1. Fetch upcoming Company Events
    const events = await this.prisma.companyEvent.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        startDate: { gte: now },
      },
    });

    // 2. Fetch upcoming Holidays
    const holidays = await this.prisma.holiday.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        date: { gte: now },
      },
    });

    const total = events.length + holidays.length;
    this.logger.log(`Syncing ${total} upcoming items for user ${userId}`);

    let succeeded = 0;
    let failed = 0;

    // Push events
    for (const event of events) {
      const ok = await this.pushEventToUser(userId, {
        title: `🏢 ${event.title}`,
        description: event.description || undefined,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location || undefined,
      });
      if (ok) succeeded++;
      else failed++;
    }

    // Push holidays
    for (const holiday of holidays) {
      // Holidays are usually all-day, but we'll set them from 9AM to 6PM UTC for now
      const start = new Date(holiday.date);
      start.setUTCHours(9, 0, 0, 0);
      const end = new Date(holiday.date);
      end.setUTCHours(18, 0, 0, 0);

      const ok = await this.pushEventToUser(userId, {
        title: `🎉 ${holiday.name}`,
        description: holiday.description || "Public Holiday",
        startDate: start,
        endDate: end,
      });
      if (ok) succeeded++;
      else failed++;
    }

    return { total, succeeded, failed };
  }
}
