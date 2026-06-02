import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export interface VerificationEmailJob {
  type: "verification";
  email: string;
  username: string;
  verificationCode: string;
  authId: string;
}

export interface WelcomeEmailJob {
  type: "welcome";
  email: string;
  username: string;
  authId?: string;
}

export interface PasswordResetEmailJob {
  type: "password-reset";
  email: string;
  username: string;
  resetCode: string;
  authId: string;
}

export interface SecurityNotificationJob {
  type: "security-notification";
  email: string;
  username: string;
  subject: string;
  message: string;
  authId?: string;
}

export interface WorkspaceInviteEmailJob {
  type: "workspace-invite";
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteToken: string;
  webAppUrl: string;
}

export type EmailJob =
  | VerificationEmailJob
  | WelcomeEmailJob
  | PasswordResetEmailJob
  | SecurityNotificationJob
  | WorkspaceInviteEmailJob;

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue("email") private emailQueue: Queue) {}

  async sendVerificationEmail(
    email: string,
    username: string,
    verificationCode: string,
    authId: string,
  ): Promise<void> {
    await this.emailQueue.add(
      "send-verification",
      {
        type: "verification",
        email,
        username,
        verificationCode,
        authId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  async sendWelcomeEmail(
    email: string,
    username: string,
    authId?: string,
  ): Promise<void> {
    await this.emailQueue.add(
      "send-welcome",
      {
        type: "welcome",
        email,
        username,
        authId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetCode: string,
    authId: string,
  ): Promise<void> {
    await this.emailQueue.add(
      "send-password-reset",
      {
        type: "password-reset",
        email,
        username,
        resetCode,
        authId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  async sendSecurityNotification(
    email: string,
    username: string,
    subject: string,
    message: string,
    authId?: string,
  ): Promise<void> {
    await this.emailQueue.add(
      "send-security-notification",
      {
        type: "security-notification",
        email,
        username,
        subject,
        message,
        authId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  async sendWorkspaceInviteEmail(
    email: string,
    inviterName: string,
    workspaceName: string,
    inviteToken: string,
    webAppUrl: string,
  ): Promise<void> {
    await this.emailQueue.add(
      "send-workspace-invite",
      {
        type: "workspace-invite",
        email,
        inviterName,
        workspaceName,
        inviteToken,
        webAppUrl,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }
}
