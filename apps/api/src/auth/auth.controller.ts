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
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutAllDto } from './dto/logout-all.dto';
import { SelectWorkspaceDto } from './dto/select-workspace.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
import {
  GoogleOAuthInitDto,
  GoogleOAuthCallbackDto,
} from './dto/google-oauth.dto';
import type { Request, Response } from 'express';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { THROTTLER_CONFIG } from '../common/config/throttler.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  // Strict rate limit for registration: 5 requests per 15 minutes
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateAuthDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully. Verification email sent.',
    schema: {
      example: {
        success: true,
        message: 'Registration successful. Please check your email for verification code.'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email', 'password must be at least 8 characters long'],
        error: 'Bad Request'
      }
    }
  })
  create(@Body() payload: CreateAuthDto, @Req() req: Request) {
    this.customLogger.log(
      `Registration attempt for email: ${payload.email}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };
    return this.authService.create(payload, meta);
  }

  // Strict rate limit for verification: 5 requests per 15 minutes
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email with verification code' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Email verified successfully',
    schema: {
      example: {
        success: true,
        message: 'Email verified successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid verification code or email',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid verification code',
        error: 'Bad Request'
      }
    }
  })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Req() req: Request) {
    this.customLogger.log(
      `Email verification attempt for: ${verifyEmailDto.email}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.code, meta);
  }

  // Strict rate limit: 5 requests per 15 minutes
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('resend-verification-email')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Verification email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Verification email sent successfully'
      }
    }
  })
  resendVerificationEmail(@Body() resendDto: ResendVerificationDto, @Req() req: Request) {
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.resendVerificationEmail(resendDto.email, meta);
  }

  // ==========================================
  // Forgot / Reset Password Endpoints
  // ==========================================

  /**
   * Request a password reset code (sent to email)
   */
  @Throttle({ default: THROTTLER_CONFIG.STRICT })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset code' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if email is registered)',
    schema: {
      example: {
        success: true,
        message: 'If this email is registered, a password reset code has been sent.',
        resetSessionId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    this.customLogger.log(
      `Forgot password request for: ${dto.email}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.forgotPassword(dto.email, meta);
  }

  /**
   * Reset password using the code from email
   */
  @Throttle({ default: THROTTLER_CONFIG.STRICT })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using emailed reset code' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code',
  })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    this.customLogger.log(
      `Password reset attempt for session: ${dto.resetSessionId}`,
      'AuthController',
    );
    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.authService.resetPassword(dto.resetSessionId, dto.code, dto.newPassword, meta);
  }

  // ==========================================
  // Google OAuth Endpoints
  // ==========================================

  /**
   * Initiate Google OAuth flow
   * Returns the Google authorization URL for the client to redirect to
   *
   * @example GET /auth/google
   * @example GET /auth/google?redirectUrl=http://localhost:3000/dashboard
   */
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ 
    status: 200, 
    description: 'Google OAuth URL generated successfully',
    schema: {
      example: {
        url: 'https://accounts.google.com/oauth/authorize?...',
        state: 'random-state-string',
        message: 'Redirect to the provided URL to authenticate with Google'
      }
    }
  })
  async googleOAuthInit(
    @Query() query: GoogleOAuthInitDto,
    @Req() req: Request,
  ) {
    this.customLogger.log(
      'Google OAuth initialization requested',
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    const { url, state } = await this.googleOAuthService.getAuthorizationUrl(
      meta,
      query.redirectUrl,
    );

    return {
      url,
      state,
      message: 'Redirect to the provided URL to authenticate with Google',
    };
  }

  /**
   * Google OAuth callback handler
   * This endpoint is called by Google after user authentication
   *
   * For browser-based flows, this redirects to the frontend
   * For API-based flows, returns JSON with tokens
   */
  @Get('google/callback')
  async googleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: Request,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Res({ passthrough: true }) res: Response,
  ) {
    // Handle OAuth errors
    if (error) {
      this.customLogger.warn(
        `Google OAuth error: ${error} - ${errorDescription}`,
        'AuthController',
      );
      Logger.warn(
        `Google OAuth error: ${error} - ${errorDescription}`,
        'AuthController',
      );

      // For browser redirect, you might want to redirect to an error page
      return {
        success: false,
        error,
        errorDescription,
        message: 'Google authentication failed',
      };
    }

    if (!code || !state) {
      return {
        success: false,
        error: 'missing_parameters',
        message: 'Missing authorization code or state parameter',
      };
    }

    this.customLogger.log('Google OAuth callback received', 'AuthController');
    Logger.log('Google OAuth callback received', 'AuthController');

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.googleOAuthService.handleCallback(
      code,
      state,
      meta,
    );

    // SECURITY: Never put tokens in URL query params (browser history / Referer header leaks).
    // Return JSON payload; the frontend SPA is responsible for receiving and storing tokens.
    // If a redirect is needed, the frontend should perform it after receiving the JSON.
    return {
      success: true,
      message: result.isNewUser
        ? 'Account created successfully via Google'
        : 'Signed in successfully via Google',
      ...result,
    };
  }

  /**
   * Alternative POST endpoint for Google OAuth callback
   * Useful for mobile apps or SPAs that handle the callback differently
   */
  @Post('google/callback')
  async googleOAuthCallbackPost(
    @Body() body: GoogleOAuthCallbackDto,
    @Req() req: Request,
  ) {
    this.customLogger.log(
      'Google OAuth callback (POST) received',
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    const result = await this.googleOAuthService.handleCallback(
      body.code,
      body.state,
      meta,
    );

    return {
      success: true,
      message: result.isNewUser
        ? 'Account created successfully via Google'
        : 'Signed in successfully via Google',
      data: result,
    };
  }

  // ==========================================
  // Login/Logout Endpoints
  // ==========================================

  /**
   * Login with email and password
   */
  // Strict rate limit for login: 5 requests per 15 minutes per IP
  @Throttle({ default: THROTTLER_CONFIG.AUTH })
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 'uuid',
            email: 'owner@acme.com',
            username: 'owner',
            role: 'USER',
            verified: true
          },
          workspaces: [
            {
              workspaceId: 'uuid',
              workspaceName: 'Acme Corporation',
              subdomain: 'acme',
              status: 'ACTIVE',
              role: 'OWNER',
              department: null
            }
          ],
          expiresIn: 3600
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized'
      }
    }
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    this.customLogger.log(
      `Login attempt for email: ${loginDto.email}`,
      'AuthController',
    );

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    return await this.authService.login({ email: loginDto.email, password: loginDto.password }, meta);
  }

  /**
   * Refresh access token using refresh token
   */
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 3600
        }
      }
    }
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    this.customLogger.log('Token refresh requested', 'AuthController');

    const meta = {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      device:
        (Array.isArray(req.headers['x-device'])
          ? req.headers['x-device'][0]
          : req.headers['x-device']) ||
        (Array.isArray(req.headers['x-device-id'])
          ? req.headers['x-device-id'][0]
          : req.headers['x-device-id']) ||
        (Array.isArray(req.headers['sec-ch-ua-platform'])
          ? req.headers['sec-ch-ua-platform'][0]
          : req.headers['sec-ch-ua-platform']),
    };

    return await this.authService.refreshToken(refreshTokenDto.refreshToken, meta);
  }

  /**
   * Logout current session
   * Requires authentication — userId is taken from the verified JWT.
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: { example: { success: true, message: 'Logged out successfully' } },
  })
  async logout(@Body() logoutDto: LogoutDto, @Req() req: Request) {
    this.customLogger.log('Logout requested', 'AuthController');
    const user = (req as any).user;

    // Prevent privilege escalation: always use userId from verified JWT
    return await this.authService.logout(logoutDto.refreshToken, user.userId);
  }

  /**
   * Logout from all devices
   * Requires authentication — userId is taken from the verified JWT.
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logout from all devices successful',
    schema: { example: { success: true, message: 'Logged out from all devices successfully' } },
  })
  async logoutAll(@Req() req: Request) {
    const user = (req as any).user;
    this.customLogger.log(
      `Logout all devices requested for user: ${user.userId}`,
      'AuthController',
    );

    return await this.authService.logoutAllDevices(user.userId);
  }

  /**
   * Get current user info
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({ 
    status: 200, 
    description: 'User information retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
        data: {
          userId: 'uuid',
          role: 'USER',
          tokenVersion: 0
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        message: 'No token found',
        error: 'Unauthorized'
      }
    }
  })
  async getCurrentUser(@Req() req: Request) {
    // This will be protected by AuthGuard
    const user = (req as any).user;
    
    return user;
  }

  /**
   * Get user's workspaces
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('workspaces')
  @ApiOperation({ summary: 'Get user workspaces' })
  @ApiResponse({ 
    status: 200, 
    description: 'User workspaces retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
        data: [
          {
            workspaceId: 'uuid',
            workspaceName: 'Acme Corporation',
            subdomain: 'acme',
            status: 'ACTIVE',
            role: 'OWNER',
            department: null,
            joinedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        message: 'No token found',
        error: 'Unauthorized'
      }
    }
  })
  async getUserWorkspaces(@Req() req: Request) {
    // Extract userId from JWT token
    const user = (req as any).user;

    return await this.authService.getUserWorkspaces(user.userId);
  }

  /**
   * Select workspace (returns new JWT with workspace context)
   */
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('select-workspace')
  @ApiOperation({ summary: 'Select workspace and get new JWT with workspace context' })
  @ApiBody({ type: SelectWorkspaceDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Workspace selected successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          workspace: {
            id: 'uuid',
            name: 'Acme Corporation',
            subdomain: 'acme',
            status: 'ACTIVE',
            role: 'OWNER',
            department: null
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'User not authenticated',
    schema: {
      example: {
        statusCode: 401,
        message: 'No token found',
        error: 'Unauthorized'
      }
    }
  })
  async selectWorkspace(@Body() selectWorkspaceDto: SelectWorkspaceDto, @Req() req: Request) {
    const user = (req as any).user;

    return await this.authService.selectWorkspace(user.userId, selectWorkspaceDto.workspaceId);
  }
}
