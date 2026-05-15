import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SelectWorkspaceDto } from './dto/select-workspace.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';
import { CustomLoggerService } from '../common/services/custom-logger.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    create: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    logoutAllDevices: jest.fn(),
    getUserWorkspaces: jest.fn(),
    selectWorkspace: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getCurrentUser: jest.fn(),
    requestPasswordChangeOtp: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockGoogleOAuthService = {
    getAuthorizationUrl: jest.fn(),
    handleCallback: jest.fn(),
  };

  const mockCustomLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GoogleOAuthService,
          useValue: mockGoogleOAuthService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateAuthDto = { username: 'test', email: 'test@test.com', password: 'password' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.create(dto, req);
      expect(mockAuthService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'password' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.login(dto, req);
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const dto: VerifyEmailDto = { email: 'test@test.com', code: '123456' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.verifyEmail(dto, req);
      expect(mockAuthService.verifyEmail).toHaveBeenCalled();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const dto: ResendVerificationDto = { email: 'test@test.com' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.resendVerificationEmail(dto, req);
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'token' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.refreshToken(dto, req);
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const dto: LogoutDto = { refreshToken: 'token' };
      const req = { user: { userId: '1' } } as any;
      await controller.logout(dto, req);
      expect(mockAuthService.logout).toHaveBeenCalledWith('token', '1');
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      const req = { user: { userId: '1' } } as any;
      await controller.logoutAll(req);
      expect(mockAuthService.logoutAllDevices).toHaveBeenCalledWith('1');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from request', async () => {
      const req = { user: { userId: '1' } } as any;
      const result = await controller.getCurrentUser(req);
      expect(result).toEqual({ userId: '1' });
    });
  });

  describe('getUserWorkspaces', () => {
    it('should return workspaces for user', async () => {
      const req = { user: { userId: '1' } } as any;
      await controller.getUserWorkspaces(req);
      expect(mockAuthService.getUserWorkspaces).toHaveBeenCalledWith('1');
    });
  });

  describe('selectWorkspace', () => {
    it('should select workspace', async () => {
      const dto: SelectWorkspaceDto = { workspaceId: 'w1' };
      const req = { user: { userId: '1' } } as any;
      await controller.selectWorkspace(dto, req);
      expect(mockAuthService.selectWorkspace).toHaveBeenCalledWith('1', 'w1');
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset', async () => {
      const dto: ForgotPasswordDto = { email: 'test@test.com' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.forgotPassword(dto, req);
      expect(mockAuthService.forgotPassword).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const dto: ResetPasswordDto = { resetSessionId: 's1', code: '123', newPassword: 'new' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      await controller.resetPassword(dto, req);
      expect(mockAuthService.resetPassword).toHaveBeenCalled();
    });
  });

  describe('googleOAuthInit', () => {
    it('should return auth url', async () => {
      const query = { redirectUrl: 'url' };
      const req = { ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as Request;
      mockGoogleOAuthService.getAuthorizationUrl.mockResolvedValue({ url: 'u', state: 's' });
      const result = await controller.googleOAuthInit(query, req);
      expect(result.url).toBe('u');
    });
  });

  describe('requestChangePasswordOtp', () => {
    it('should request otp', async () => {
      const req = { user: { userId: '1' } } as any;
      mockAuthService.getCurrentUser.mockResolvedValue({ email: 'test@test.com' });
      await controller.requestChangePasswordOtp(req);
      expect(mockAuthService.requestPasswordChangeOtp).toHaveBeenCalledWith('1', 'test@test.com');
    });
  });

  describe('changePassword', () => {
    it('should change password', async () => {
      const dto: ChangePasswordDto = { code: '123', newPassword: 'new' };
      const req = { user: { userId: '1' }, ip: '1.1.1.1', headers: { 'user-agent': 'UA' } } as any;
      await controller.changePassword(dto, req);
      expect(mockAuthService.changePassword).toHaveBeenCalled();
    });
  });
});
