import { Controller, All, Req, Res, Logger } from '@nestjs/common';
import { BetterAuthService } from './services/better-auth.service';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class BetterAuthController {
  private readonly logger = new Logger(BetterAuthController.name);

  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Public()
  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    this.logger.debug(`Better Auth handling request: ${req.method} ${req.url}`);
    return this.betterAuthService.instance.handler(req, res);
  }
}

