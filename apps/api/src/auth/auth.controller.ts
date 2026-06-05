import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Res,
  Logger,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { GoogleOAuthService } from "./services/google-oauth.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { LogoutDto } from "./dto/logout.dto";
import { LogoutAllDto } from "./dto/logout-all.dto";
import { SelectWorkspaceDto } from "./dto/select-workspace.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
// import { UpdateAuthDto } from './dto/update-auth.dto';
import {
  GoogleOAuthInitDto,
  GoogleOAuthCallbackDto,
} from "./dto/google-oauth.dto";
import type { Request, Response } from "express";
import { CustomLoggerService } from "../common/services/custom-logger.service";
import { THROTTLER_CONFIG } from "../common/config/throttler.config";

@ApiTags("auth")
@Controller("legacy-auth")
export class LegacyAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  /**
   * Request an OTP for changing password
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("change-password/request")
  @ApiOperation({ summary: "Request an OTP for changing password" })
  async requestChangePasswordOtp(@Req() req: Request) {
    const user = (req as any).user;
    const userFull = await this.authService.getCurrentUser(req);
    return await this.authService.requestPasswordChangeOtp(
      user.userId,
      userFull.email,
    );
  }

  /**
   * Confirm password change using OTP
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("change-password/confirm")
  @ApiOperation({ summary: "Confirm password change using OTP" })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const user = (req as any).user;
    const meta = {
      ip: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    };
    return await this.authService.changePassword(user.userId, dto, meta);
  }

  /**
   * Get current user info
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user information" })
  async getCurrentUser(@Req() req: Request) {
    return await this.authService.getCurrentUser(req);
  }

  /**
   * Get user's workspaces
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Get("workspaces")
  @ApiOperation({ summary: "Get user workspaces" })
  async getUserWorkspaces(@Req() req: Request) {
    const user = (req as any).user;
    return await this.authService.getUserWorkspaces(user.userId);
  }

  /**
   * Select workspace (returns new JWT with workspace context)
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Post("select-workspace")
  @ApiOperation({
    summary: "Select workspace and get new JWT with workspace context",
  })
  @ApiBody({ type: SelectWorkspaceDto })
  async selectWorkspace(
    @Body() selectWorkspaceDto: SelectWorkspaceDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    return await this.authService.selectWorkspace(
      user.userId,
      selectWorkspaceDto.workspaceId,
    );
  }
}
