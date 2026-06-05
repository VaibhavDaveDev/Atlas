import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TurnstileService } from '../services/turnstile.service';
import { TURNSTILE_KEY } from '../decorators/turnstile.decorator';
import type { Request } from 'express';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private turnstileService: TurnstileService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if Turnstile is required for this endpoint
    const requireTurnstile = this.reflector.getAllAndOverride<boolean>(
      TURNSTILE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If not required, allow the request
    if (requireTurnstile === false) {
      return true;
    }

    // If Turnstile is not enabled (no secret key), allow the request
    if (!this.turnstileService.isEnabled()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const turnstileToken =
      request.body?.turnstileToken || request.headers['x-turnstile-token'];

    if (!turnstileToken) {
      throw new UnauthorizedException(
        'Security verification is required. Please refresh the page and try again.',
      );
    }

    // Get client IP for additional verification
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      request.socket.remoteAddress;

    // Verify the token
    await this.turnstileService.verifyToken(turnstileToken, clientIp);

    return true;
  }
}
