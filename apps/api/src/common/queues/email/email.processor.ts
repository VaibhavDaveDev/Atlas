import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { EmailJob } from "./email.queue";
import { EmailService } from "src/common/services/email.service";
import { PrismaService } from "src/common/services/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Processor("email")
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    this.logger.info(`Processing email job: ${job.name} (ID: ${job.id})`, {
      context: "EmailProcessor",
      jobId: job.id,
      jobName: job.name,
    });

    try {
      switch (job.data.type) {
        case "verification":
          await this.handleVerificationEmail(job);
          break;
        case "welcome":
          await this.handleWelcomeEmail(job);
          break;
        case "password-reset":
          await this.handlePasswordResetEmail(job);
          break;
        case "security-notification":
          await this.handleSecurityNotification(job);
          break;
        case "workspace-invite":
          await this.handleWorkspaceInviteEmail(job);
          break;
        case "otp":
          await this.handleOtpEmail(job);
          break;
        case "magic-link":
          await this.handleMagicLinkEmail(job);
          break;
        default:
          this.logger.warn(
            `Unknown email job type: ${String((job.data as { type?: string }).type || "undefined")}`,
            { context: "EmailProcessor", jobId: job.id },
          );
      }
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, {
        context: "EmailProcessor",
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error; // Re-throw to trigger retry
    }
  }

  private async handleVerificationEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "verification" }>;
    const { email, username, verificationCode, authId } = data;

    // ─── DEV: Print code to console so you don't need an email service ───────
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`   [DEV] VERIFICATION CODE`);
      console.log(`    To      : ${email}`);
      console.log(`    Code    : ${verificationCode}`);
      console.log(`${'─'.repeat(60)}\n`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      await this.emailService.sendVerificationEmail(
        email,
        username,
        verificationCode,
      );

      await this.prismaService.emailHistory.updateMany({
        where: { authId, emailType: "verification", emailStatus: "pending" },
        data: { emailStatus: "sent" },
      });

      this.logger.info(`Verification email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      await this.prismaService.emailHistory.updateMany({
        where: { authId, emailType: "verification", emailStatus: "pending" },
        data: {
          emailStatus: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Failed to send email",
        },
      });
      throw error;
    }
  }

  private async handleWelcomeEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "welcome" }>;
    const { email, username } = data;

    try {
      await this.emailService.sendWelcomeEmail(email, username);
      this.logger.info(`Welcome email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      // Non-critical — don't re-throw
    }
  }

  private async handlePasswordResetEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "password-reset" }>;
    const { email, username, resetCode } = data;

    // ─── DEV: Print code to console ──────────────────────────────────────────
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`   [DEV] PASSWORD RESET CODE`);
      console.log(`    To      : ${email}`);
      console.log(`    Code    : ${resetCode}`);
      console.log(`${'─'.repeat(60)}\n`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      await this.emailService.sendPasswordResetEmail(email, username, resetCode);
      this.logger.info(`Password reset email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async handleSecurityNotification(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "security-notification" }>;
    const { email, subject, message } = data;

    try {
      await this.emailService.sendEmail({
        to: email,
        subject,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d32f2f;">Security Notification</h2>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated security notification from Atlas ERP. If you did not perform this action, please contact support immediately.</p>
        </div>`,
      });
      this.logger.info(`Security notification email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send security notification email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      // Non-critical — don't re-throw
    }
  }

  private async handleWorkspaceInviteEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "workspace-invite" }>;
    const { email, inviterName, workspaceName, magicLinkUrl } = data;

    try {
      await this.emailService.sendWorkspaceInviteEmail(
        email,
        inviterName,
        workspaceName,
        magicLinkUrl,
      );
      this.logger.info(`Workspace invite email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send workspace invite email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async handleOtpEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "otp" }>;
    const { email, otp, otpType } = data;

    // ─── DEV: Print code to console ──────────────────────────────────────────
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`   [DEV] OTP CODE (${otpType})`);
      console.log(`    To      : ${email}`);
      console.log(`    OTP     : ${otp}`);
      console.log(`${'─'.repeat(60)}\n`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      await this.emailService.sendOtpEmail(email, otp, otpType);
      this.logger.info(`OTP email (${otpType}) sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
        otpType,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, {
        context: "EmailProcessor",
        email,
        otpType,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async handleMagicLinkEmail(job: Job<EmailJob>): Promise<void> {
    const data = job.data as Extract<EmailJob, { type: "magic-link" }>;
    const { email, magicLinkUrl, inviterName, workspaceName } = data;

    try {
      await this.emailService.sendMagicLinkEmail(
        email,
        magicLinkUrl,
        inviterName,
        workspaceName,
      );
      this.logger.info(`Magic link email sent successfully to ${email}`, {
        context: "EmailProcessor",
        jobId: job.id,
        email,
      });
    } catch (error) {
      this.logger.error(`Failed to send magic link email to ${email}`, {
        context: "EmailProcessor",
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
