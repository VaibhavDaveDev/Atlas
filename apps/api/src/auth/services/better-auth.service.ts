import { Injectable } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { EmailQueueService } from "../../common/queues/email/email.queue";

@Injectable()
export class BetterAuthService {
  public readonly auth: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailQueue: EmailQueueService,
  ) {
    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, {
        provider: "postgresql",
      }),
      user: {
        additionalFields: {
          username: {
            type: "string",
            required: false,
          },
          globalRole: {
            type: "string",
            defaultValue: "USER",
          },
          isSuperAdmin: {
            type: "boolean",
            defaultValue: false,
          },
          status: {
            type: "string",
            defaultValue: "ACTIVE",
          },
        },
      },
      plugins: [bearer()],
      secondaryStorage: {
        get: async (key) => {
          return await this.redis.get<string>(key);
        },
        set: async (key, value, ttl) => {
          await this.redis.set(key, value, ttl);
        },
        delete: async (key) => {
          await this.redis.del(key);
        },
      },
      emailAndPassword: {
        enabled: true,
      },
      account: {
        accountLinking: {
          enabled: true,
          // Allow linking a Google/social account whose email differs from the
          // user's Atlas work email
          allowDifferentEmails: true,
        },
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          scope: [
            "https://www.googleapis.com/auth/calendar.events",
            "email",
            "profile",
          ],
          // Request offline access so we get a refresh_token for Calendar API
          accessType: "offline",
          prompt: "consent",
        },
      },
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
      basePath: "/api/v1/auth",
      trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
      advanced: {
        // In cross-domain setup (Vercel + Cloud Run), sameSite: 'none' is mandatory.
        // In local dev (HTTP), Secure cookies are dropped by the browser — use lax instead.
        useSecureCookies: process.env.NODE_ENV === "production",
        defaultCookieAttributes: {
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 24 hours
      },
      events: {
        onUserCreated: async (user) => {
          // Send welcome email after user creation (applies to both Email/Password and OAuth)
          await this.emailQueue
            .sendWelcomeEmail(user.email, user.name, user.id)
            .catch((err) => {
              console.error("Failed to queue welcome email:", err);
            });
        },
      },
    });
  }

  /**
   * Helper to get the BetterAuth instance directly
   */
  get instance() {
    return this.auth;
  }
}
