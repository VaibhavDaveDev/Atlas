import { Controller, All, Req, Res, Logger, HttpStatus } from "@nestjs/common";
import { BetterAuthService } from "./services/better-auth.service";
import type { Request, Response } from "express";
import { Public } from "./decorators/public.decorator";

@Controller("auth")
export class BetterAuthController {
  private readonly logger = new Logger(BetterAuthController.name);

  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Public()
  @All("*path")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Sync req.url → req.originalUrl so Better Auth's router sees the full
    // path (e.g. /api/v1/auth/sign-in/email) instead of the NestJS-relative path.
    if (req.url !== req.originalUrl) {
      req.url = req.originalUrl;
    }

    try {
      return await this.betterAuthService.nodeHandler(req, res);
    } catch (error) {
      this.logger.error(
        `Better Auth handler error on ${req.method} ${req.url}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
