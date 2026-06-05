import type { BetterAuthPlugin } from "better-auth";
import { Logger } from "@nestjs/common";

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

/**
 * Better Auth plugin for Cloudflare Turnstile verification
 * Validates turnstile tokens before allowing sign-in/sign-up
 */
export const turnstilePlugin = (): BetterAuthPlugin => {
  const logger = new Logger("TurnstilePlugin");
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  /**
   * Verify Turnstile token with Cloudflare API
   */
  const verifyToken = async (
    token: string,
    remoteIp?: string,
  ): Promise<boolean> => {
    if (!secretKey) {
      logger.warn(
        "Turnstile secret key not configured - skipping verification in development",
      );
      return true;
    }

    if (!token) {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", secretKey);
      formData.append("response", token);
      if (remoteIp) {
        formData.append("remoteip", remoteIp);
      }

      const response = await fetch(verifyUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data: TurnstileVerifyResponse = await response.json();

      if (!data.success) {
        logger.error(
          `Turnstile verification failed: ${JSON.stringify(data["error-codes"])}`,
        );
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error(`Turnstile verification error: ${error?.message || error}`);
      return false;
    }
  };

  /**
   * Extract client IP from request context
   */
  const getClientIp = (context: any): string | undefined => {
    try {
      const forwardedFor = context.request?.headers?.get?.("x-forwarded-for");
      if (forwardedFor) {
        return forwardedFor.split(",")[0];
      }
      const realIp = context.request?.headers?.get?.("x-real-ip");
      if (realIp) {
        return realIp;
      }
    } catch (error) {
      // Ignore errors in IP extraction
    }
    return undefined;
  };

  return {
    id: "turnstile-verification",
    hooks: {
      before: [
        {
          // Hook into email/password sign-in
          matcher(context) {
            return (
              context.path === "/sign-in/email" && context.method === "POST"
            );
          },
          async handler(context) {
            try {
              const body = context.body as any;
              const turnstileToken = body?.turnstileToken;

              // Skip if not enabled
              if (!secretKey) {
                return;
              }

              // Check if token is provided
              if (!turnstileToken) {
                logger.warn("Sign-in attempt without Turnstile token");
                return new Response(
                  JSON.stringify({
                    error: "security_verification_required",
                    message:
                      "Security verification is required. Please refresh the page and try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              // Get client IP
              const clientIp = getClientIp(context);

              // Verify token
              const isValid = await verifyToken(turnstileToken, clientIp);
              if (!isValid) {
                logger.warn(
                  `Failed Turnstile verification for sign-in from IP: ${clientIp}`,
                );
                return new Response(
                  JSON.stringify({
                    error: "security_verification_failed",
                    message:
                      "Security verification failed. Please try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              logger.log(
                `Turnstile verification passed for sign-in from IP: ${clientIp}`,
              );
            } catch (error: any) {
              logger.error(`Error in Turnstile sign-in hook: ${error?.message || error}`);
              return new Response(
                JSON.stringify({
                  error: "internal_error",
                  message: "An error occurred during security verification.",
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
          },
        },
        {
          // Hook into email/password sign-up
          matcher(context) {
            return (
              context.path === "/sign-up/email" && context.method === "POST"
            );
          },
          async handler(context) {
            try {
              const body = context.body as any;
              const turnstileToken = body?.turnstileToken;

              // Skip if not enabled
              if (!secretKey) {
                return;
              }

              // Check if token is provided
              if (!turnstileToken) {
                logger.warn("Sign-up attempt without Turnstile token");
                return new Response(
                  JSON.stringify({
                    error: "security_verification_required",
                    message:
                      "Security verification is required. Please refresh the page and try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              // Get client IP
              const clientIp = getClientIp(context);

              // Verify token
              const isValid = await verifyToken(turnstileToken, clientIp);
              if (!isValid) {
                logger.warn(
                  `Failed Turnstile verification for sign-up from IP: ${clientIp}`,
                );
                return new Response(
                  JSON.stringify({
                    error: "security_verification_failed",
                    message:
                      "Security verification failed. Please try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              logger.log(
                `Turnstile verification passed for sign-up from IP: ${clientIp}`,
              );
            } catch (error: any) {
              logger.error(`Error in Turnstile sign-up hook: ${error?.message || error}`);
              return new Response(
                JSON.stringify({
                  error: "internal_error",
                  message: "An error occurred during security verification.",
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
          },
        },
        {
          // Hook into passwordless sign-in (Email OTP)
          matcher(context) {
            return (
              context.path === "/email-otp/sign-in" && context.method === "POST"
            );
          },
          async handler(context) {
            try {
              const body = context.body as any;
              const turnstileToken = body?.turnstileToken;

              // Skip if not enabled
              if (!secretKey) {
                return;
              }

              // Check if token is provided
              if (!turnstileToken) {
                logger.warn("OTP sign-in attempt without Turnstile token");
                return new Response(
                  JSON.stringify({
                    error: "security_verification_required",
                    message:
                      "Security verification is required. Please refresh the page and try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              // Get client IP
              const clientIp = getClientIp(context);

              // Verify token
              const isValid = await verifyToken(turnstileToken, clientIp);
              if (!isValid) {
                logger.warn(
                  `Failed Turnstile verification for OTP sign-in from IP: ${clientIp}`,
                );
                return new Response(
                  JSON.stringify({
                    error: "security_verification_failed",
                    message:
                      "Security verification failed. Please try again.",
                  }),
                  {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              logger.log(
                `Turnstile verification passed for OTP sign-in from IP: ${clientIp}`,
              );
            } catch (error: any) {
              logger.error(
                `Error in Turnstile OTP sign-in hook: ${error?.message || error}`,
              );
              return new Response(
                JSON.stringify({
                  error: "internal_error",
                  message: "An error occurred during security verification.",
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
          },
        },
      ],
    },
  };
};
