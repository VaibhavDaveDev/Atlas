import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiCookieAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { PrismaService } from "../common/services/prisma.service";
import { SelectWorkspaceDto } from "./dto/select-workspace.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import type { Request } from "express";
import { CustomLoggerService } from "../common/services/custom-logger.service";

@ApiTags("auth")
@Controller("legacy-auth")
export class LegacyAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customLogger: CustomLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Request an OTP for changing password
   */
  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
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
  @ApiCookieAuth("better-auth-cookie")
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
  @ApiCookieAuth("better-auth-cookie")
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user information" })
  async getCurrentUser(@Req() req: Request) {
    return await this.authService.getCurrentUser(req);
  }

  /**
   * Get user's workspaces
   */
  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
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
  @ApiCookieAuth("better-auth-cookie")
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

  /**
   * Check if an email domain has an SSO provider configured — public, no auth required.
   * Used by the login page to redirect corporate users to the correct SSO flow.
   */
  @SkipThrottle()
  @Get("sso/check-domain")
  @ApiOperation({ summary: "Check if a domain has SSO configured" })
  @ApiQuery({ name: "domain", description: "Email domain to check (e.g. acme.com)" })
  async checkSsoDomain(@Query("domain") domain: string) {
    if (!domain) return { hasSso: false, providerId: null };

    const provider = await this.prisma.authSsoProvider.findFirst({
      where: { domain },
      select: { id: true, providerId: true },
    });

    return { hasSso: !!provider, providerId: provider?.providerId ?? null };
  }

  /**
   * Test an SSO provider configuration before saving — server-side to avoid CORS.
   * For OIDC: fetches the discovery document and validates the `issuer` field.
   * For SAML: verifies the metadata URL is reachable and returns SAML XML.
   * Public endpoint (no auth required) so it can be called from the setup wizard.
   */
  @SkipThrottle()
  @Post("sso/test-config")
  @ApiOperation({ summary: "Server-side test of an SSO provider configuration" })
  async testSsoConfig(
    @Body() body: { protocol: 'OIDC' | 'SAML'; metadataUrl: string },
  ) {
    const { protocol, metadataUrl } = body;

    if (!metadataUrl) {
      throw new BadRequestException('metadataUrl is required');
    }

    try {
      if (protocol === 'OIDC') {
        const discoveryUrl = `${metadataUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;
        const res = await fetch(discoveryUrl);
        if (!res.ok) {
          return { ok: false, error: `Discovery endpoint returned HTTP ${res.status}` };
        }
        const doc = await res.json() as Record<string, unknown>;
        if (!doc.issuer) {
          return { ok: false, error: 'Response is not a valid OIDC discovery document (missing issuer field)' };
        }
        return { ok: true, issuer: doc.issuer, authorizationEndpoint: doc.authorization_endpoint };
      } else {
        // SAML — just verify reachability + basic XML structure
        const res = await fetch(metadataUrl);
        if (!res.ok) {
          return { ok: false, error: `SAML metadata URL returned HTTP ${res.status}` };
        }
        const text = await res.text();
        if (!text.includes('EntityDescriptor') && !text.includes('saml')) {
          return { ok: false, error: 'URL does not appear to serve SAML metadata XML (EntityDescriptor not found)' };
        }
        // Extract EntityID from XML if present
        const entityIdMatch = text.match(/entityID="([^"]+)"/);
        return { ok: true, entityId: entityIdMatch?.[1] ?? null };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Request failed' };
    }
  }
}
