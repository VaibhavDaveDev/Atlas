import { Injectable } from "@nestjs/common";
import { BrevoClient } from "@getbrevo/brevo";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
import { promises as fs } from "fs";
import * as path from "path";
import config from "../config/app.config";
import AppError from "../errors/app.error";
import httpStatus from "http-status";
import { CustomLoggerService } from "./custom-logger.service";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly brevo: BrevoClient | null = null;
  private readonly gmailTransporter: Transporter | null = null;

  constructor(private readonly customLogger: CustomLoggerService) {
    const provider = config.email_provider;

    if (provider === "gmail") {
      // ── Gmail SMTP via nodemailer ──────────────────────────────────────────
      // Requires a Google "App Password" (not your normal Gmail password).
      // Enable at: https://myaccount.google.com/apppasswords
      if (!config.gmail_user || !config.gmail_app_password) {
        if (config.node_env === "production") {
          throw new Error(
            "Invalid email config: EMAIL_PROVIDER=gmail but GMAIL_USER or GMAIL_APP_PASSWORD is missing.",
          );
        } else {
          this.customLogger.warn(
            "Gmail SMTP credentials missing. Email service will run in mock mode.",
            "EmailService",
          );
        }
      } else {
        this.gmailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.gmail_user,
            pass: config.gmail_app_password,
          },
        });
        this.customLogger.log(
          `Email provider: Gmail SMTP (${config.gmail_user})`,
          "EmailService",
        );
      }
    } else {
      // ── Brevo transactional API (default) ─────────────────────────────────
      if (!config.brevo_api_key) {
        if (config.node_env === "production") {
          throw new Error(
            "Invalid email config: EMAIL_PROVIDER=brevo but BREVO_API_KEY is missing.",
          );
        } else {
          this.customLogger.warn(
            "BREVO_API_KEY is missing. Email service will run in mock mode (logging to console).",
            "EmailService",
          );
        }
      } else {
        this.brevo = new BrevoClient({
          apiKey: config.brevo_api_key,
          maxRetries: 3,
          timeoutInSeconds: 30,
        });
        this.customLogger.log("Email provider: Brevo", "EmailService");
      }
    }
  }

  /**
   * Send an email via the configured provider (Brevo or Gmail SMTP).
   * Falls back to console logging if no provider is configured (dev mode).
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    // Mock mode — no credentials configured
    if (!this.brevo && !this.gmailTransporter) {
      this.customLogger.log(
        `[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`,
        "EmailService",
      );
      return;
    }

    try {
      if (config.email_provider === "gmail" && this.gmailTransporter) {
        await this.gmailTransporter.sendMail({
          from: `"${config.email_from_name || "Atlas ERP"}" <${config.gmail_user}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
      } else if (this.brevo) {
        await this.brevo.transactionalEmails.sendTransacEmail({
          sender: {
            name: config.email_from_name || "Atlas ERP",
            email: config.email_from,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          textContent: options.text,
          htmlContent: options.html,
        });
      }

      this.customLogger.log(
        `Email sent successfully to: ${options.to} (via ${config.email_provider})`,
        "EmailService",
      );
    } catch (error) {
      this.customLogger.error(
        `Error sending email to ${options.to} (via ${config.email_provider})`,
        error instanceof Error ? error.stack : undefined,
        "EmailService",
      );
      const errMsg = error instanceof Error ? error.message : String(error);
      throw AppError.badRequest(`Email sending failed: ${errMsg}`);
    }
  }

  /**
   * Load and parse email template
   */
  async getEmailTemplate(
    filePath: string,
    replacements: Record<string, string>,
  ): Promise<string> {
    try {
      const absolutePath = path.resolve(
        process.cwd(),
        "templates",
        "emails",
        filePath,
      );
      let template = await fs.readFile(absolutePath, { encoding: "utf-8" });

      for (const key in replacements) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        template = template.replace(
          new RegExp(`{{${escapedKey}}}`, "g"),
          replacements[key],
        );
      }

      return template;
    } catch (error) {
      console.error("Error reading email template:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Email template loading failed.",
      );
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    username: string,
    verificationCode: string,
  ): Promise<void> {
    const html = await this.getEmailTemplate("verification.html", {
      username,
      verificationCode,
      year: new Date().getFullYear().toString(),
    });

    await this.sendEmail({
      to: email,
      subject: "Verify your email address",
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetCode: string,
  ): Promise<void> {
    const html = await this.getEmailTemplate("password-reset.html", {
      username,
      resetCode,
      year: new Date().getFullYear().toString(),
    });

    await this.sendEmail({
      to: email,
      subject: "Reset your password",
      html,
    });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const html = await this.getEmailTemplate("welcome.html", {
      username,
      year: new Date().getFullYear().toString(),
    });

    await this.sendEmail({
      to: email,
      subject: "Welcome to Atlas ERP!",
      html,
    });
  }

  /**
   * Send workspace invite email with a magic link URL
   */
  async sendWorkspaceInviteEmail(
    email: string,
    inviterName: string,
    workspaceName: string,
    magicLinkUrl: string,
  ): Promise<void> {
    const html = await this.getEmailTemplate("workspace-invite.html", {
      inviterName,
      workspaceName,
      acceptUrl: magicLinkUrl,
      year: new Date().getFullYear().toString(),
    });

    await this.sendEmail({
      to: email,
      subject: `You've been invited to join ${workspaceName} on Atlas ERP`,
      html,
    });
  }

  /**
   * Send a plain OTP code email (for emailOTP plugin callbacks)
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    type: "sign-in" | "email-verification" | "forget-password",
  ): Promise<void> {
    const subjectMap: Record<typeof type, string> = {
      "sign-in": "Your Atlas sign-in code",
      "email-verification": "Verify your email address",
      "forget-password": "Reset your Atlas password",
    };

    const labelMap: Record<typeof type, string> = {
      "sign-in": "Use this code to sign in to Atlas ERP:",
      "email-verification": "Use this code to verify your email address:",
      "forget-password": "Use this code to reset your password:",
    };

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 20px; font-weight: 600; color: #111111; margin: 0 0 8px;">${subjectMap[type]}</h1>
          <p style="font-size: 14px; color: #626260; margin: 0;">${labelMap[type]}</p>
        </div>
        <div style="background: #f5f1ec; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #111111; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #7b7b78; margin: 0 0 8px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="font-size: 13px; color: #7b7b78; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e2db; margin: 32px 0;" />
        <p style="font-size: 12px; color: #a1a1aa; margin: 0;">Atlas ERP &mdash; ${new Date().getFullYear()}</p>
      </div>`;

    await this.sendEmail({
      to: email,
      subject: subjectMap[type],
      html,
    });
  }

  /**
   * Send a magic link invite email
   */
  async sendMagicLinkEmail(
    email: string,
    magicLinkUrl: string,
    inviterName?: string,
    workspaceName?: string,
  ): Promise<void> {
    const isInvite = !!(inviterName && workspaceName);
    const title = isInvite
      ? `${inviterName} invited you to ${workspaceName}`
      : "Sign in to Atlas ERP";
    const bodyText = isInvite
      ? `${inviterName} has invited you to join <strong>${workspaceName}</strong> on Atlas ERP. Click the button below to accept the invitation and sign in.`
      : "Click the button below to sign in to Atlas ERP. This link expires in 5 minutes and can only be used once.";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 20px; font-weight: 600; color: #111111; margin: 0 0 8px;">${title}</h1>
          <p style="font-size: 14px; color: #626260; margin: 0;">${bodyText}</p>
        </div>
        <div style="margin-bottom: 32px;">
          <a href="${magicLinkUrl}" style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            ${isInvite ? "Accept invitation" : "Sign in to Atlas"}
          </a>
        </div>
        <p style="font-size: 13px; color: #7b7b78; margin: 0 0 8px;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #7b7b78; word-break: break-all; margin: 0 0 32px;">${magicLinkUrl}</p>
        <p style="font-size: 13px; color: #7b7b78; margin: 0;">This link expires in <strong>15 minutes</strong> and can only be used once.</p>
        <hr style="border: 0; border-top: 1px solid #e5e2db; margin: 32px 0;" />
        <p style="font-size: 12px; color: #a1a1aa; margin: 0;">Atlas ERP &mdash; ${new Date().getFullYear()}</p>
      </div>`;

    await this.sendEmail({
      to: email,
      subject: title,
      html,
    });
  }
}
