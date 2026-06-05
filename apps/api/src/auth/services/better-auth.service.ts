import { Injectable, Logger } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  bearer,
  organization,
  twoFactor,
  admin,
  magicLink,
  emailOTP,
} from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { PrismaService } from "../../common/services/prisma.service";
import { RedisService } from "../../common/services/redis.service";
import { EmailQueueService } from "../../common/queues/email/email.queue";
import config from "../../common/config/app.config";
import * as bcrypt from "bcryptjs";

/** OTP / magic-link cool-down window in seconds (5 min = same as OTP TTL) */
const OTP_COOLDOWN_SECONDS = 300;

@Injectable()
export class BetterAuthService {
  public readonly auth: any;
  private readonly logger = new Logger(BetterAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailQueue: EmailQueueService,
  ) {
    const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3001";
    const basePath = "/api/v1/auth";

    // Better Auth's "fallback join" query path bypasses the modelName mapping
    // and accesses Prisma using its own default model names (e.g. prisma.account,
    // prisma.user, prisma.session). Our Prisma models are prefixed with Auth*
    // (e.g. prisma.authAccount), so those direct accesses fail with
    // "Model account does not exist". This proxy transparently redirects them.
    const MODEL_MAP: Record<string, string> = {
      account: "authAccount",
      user: "authUser",
      session: "authSession",
      verification: "authVerification",
      organization: "authOrganization",
      member: "authMember",
      invitation: "authInvitation",
      twoFactor: "authTwoFactor",
      ssoProvider: "authSsoProvider",
      // camelCase variants (just in case)
      AuthAccount: "authAccount",
      AuthUser: "authUser",
      AuthSession: "authSession",
      AuthVerification: "authVerification",
      AuthOrganization: "authOrganization",
      AuthMember: "authMember",
      AuthInvitation: "authInvitation",
      AuthTwoFactor: "authTwoFactor",
      AuthSsoProvider: "authSsoProvider",
    };

    const prismaProxy = new Proxy(this.prisma, {
      get(target: any, prop: string) {
        return MODEL_MAP[prop] ? target[MODEL_MAP[prop]] : target[prop];
      },
    });

    // Capture service refs in local variables for use in plugin closures
    const queue = this.emailQueue;
    const redisService = this.redis;
    const logger = this.logger;

    this.auth = betterAuth({
      database: prismaAdapter(prismaProxy, {
        provider: "postgresql",
        modelName: {
          user: "AuthUser",
          session: "AuthSession",
          account: "AuthAccount",
          verification: "AuthVerification",
          organization: "AuthOrganization",
          member: "AuthMember",
          invitation: "AuthInvitation",
          twoFactor: "AuthTwoFactor",
          ssoProvider: "AuthSsoProvider",
        },
      } as any),
      user: {
        modelName: "AuthUser",
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
      emailAndPassword: {
        enabled: true,
        password: {
          hash: async (password) => {
            return await bcrypt.hash(password, 10);
          },
          verify: async ({ password, hash }) => {
            return await bcrypt.compare(password, hash);
          },
        },
      },
      plugins: [
        bearer(),

        organization({
          acStore: { modelName: "AuthOrganization" },
          member: { modelName: "AuthMember" },
          invitation: { modelName: "AuthInvitation" },
        } as any),

        sso(),

        // ─── Two-Factor (TOTP authenticator app) ────────────────────────────
        // Requires current password before enabling/disabling 2FA.
        // No email OTP for 2FA — users scan QR code with authenticator app.
        twoFactor({
          issuer: "Atlas ERP",
          skipVerificationOnEnable: false,
        }),

        admin(),

        // ─── Magic Link ──────────────────────────────────────────────────────
        // Used for workspace invitations. New users are auto-created on click.
        magicLink({
          expiresIn: 60 * 15, // 15 minutes
          disableSignUp: false,
          sendMagicLink: async ({ email, url }) => {
            try {
              await queue.sendMagicLinkEmail(email, url);
            } catch (err) {
              logger.error(`Failed to queue magic link email for ${email}`, err);
              throw err;
            }
          },
        }),

        // ─── Email OTP ───────────────────────────────────────────────────────
        // Used for email verification, passwordless sign-in, password reset.
        // resendStrategy: "reuse" — reuses existing OTP if still valid.
        // The before-hook below enforces a user-facing cooldown on top.
        emailOTP({
          otpLength: 6,
          expiresIn: OTP_COOLDOWN_SECONDS,
          resendStrategy: "reuse",
          disableSignUp: false,
          async sendVerificationOTP({ email, otp, type }) {
            const otpTypeMap: Record<
              string,
              "sign-in" | "email-verification" | "forget-password"
            > = {
              "sign-in": "sign-in",
              "email-verification": "email-verification",
              "forget-password": "forget-password",
            };
            const mappedType = otpTypeMap[type] ?? "sign-in";
            try {
              await queue.sendOtpEmail(email, otp, mappedType);
            } catch (err) {
              logger.error(`Failed to queue OTP email for ${email}`, err);
              throw err;
            }
          },
        }),
      ],
      secondaryStorage: {
        get: async (key) => {
          return await redisService.get<string>(key);
        },
        set: async (key, value, ttl) => {
          await redisService.set(key, value, ttl);
        },
        delete: async (key) => {
          await redisService.del(key);
        },
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
      baseURL: baseURL,
      basePath: basePath,
      trustedOrigins: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        ...(process.env.WEB_URL ? [process.env.WEB_URL] : []),
        ...(process.env.TRUSTED_ORIGINS
          ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
          : []),
      ],
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
      hooks: {
        before: async (context: any) => {
          // ─── OTP Resend Cooldown Guard ──────────────────────────────────
          // Check if a cooldown key exists in Redis. If the user requested
          // an OTP within the last 5 minutes, return a 429 with wait time.
          const isOtpEndpoint =
            context.path === "/email-otp/send-verification-otp" ||
            context.path === "/email-otp/sign-in";

          if (!isOtpEndpoint) return undefined;

          const email = (context.body as { email?: string })?.email;
          if (!email) return undefined;

          const cooldownKey = `otp:cooldown:${email}`;
          const sentAt = await redisService.get<number>(cooldownKey);

          if (sentAt) {
            const elapsed = Math.floor((Date.now() - sentAt) / 1000);
            const remaining = OTP_COOLDOWN_SECONDS - elapsed;
            if (remaining > 0) {
              const mins = Math.ceil(remaining / 60);
              return Response.json(
                {
                  error: "rate_limit",
                  message: `Please wait ${mins} minute${mins > 1 ? "s" : ""} before requesting another code. Your previous code is still valid.`,
                  retryAfterSeconds: remaining,
                },
                { status: 429 },
              );
            }
          }

          // Set cooldown key — expires when the OTP does
          await redisService.set(cooldownKey, Date.now(), OTP_COOLDOWN_SECONDS);
          return undefined;
        },
      },
      events: {
        onUserCreated: async (user: { email: string; name: string; id: string }) => {
          // Send welcome email after user creation (applies to Email/Password and OAuth)
          await queue
            .sendWelcomeEmail(user.email, user.name, user.id)
            .catch((err) => {
              logger.error("Failed to queue welcome email", err);
            });
        },
      },
    });
  }

  /**
   * The raw Better Auth instance (for session validation etc.)
   */
  get instance() {
    return this.auth;
  }

  /**
   * Node.js-compatible handler built with toNodeHandler.
   * This correctly converts the IncomingMessage → web Request
   * (sets the full base URL from req.headers.host) and then
   * calls processRequest — fixing the "Invalid URL" error.
   */
  get nodeHandler() {
    return toNodeHandler(this.auth);
  }

  /**
   * Generate a magic link URL via the BetterAuth API.
   * Used by WorkspaceService when creating invites.
   * Returns null if the magic link API is unavailable.
   */
  async createMagicLink(
    email: string,
    callbackURL: string,
  ): Promise<string | null> {
    try {
      const response = await this.auth.api.signInMagicLink({
        body: { email, callbackURL },
      });
      return (response?.magicLink as string) ?? null;
    } catch (err) {
      this.logger.error(`Failed to create magic link for ${email}`, err);
      return null;
    }
  }
}
