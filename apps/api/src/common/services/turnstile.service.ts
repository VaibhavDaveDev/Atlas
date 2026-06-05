import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

@Injectable()
export class TurnstileService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY') || '';
  }

  /**
   * Verify Turnstile token from client
   * @param token The token from the Turnstile widget
   * @param remoteIp Optional: The user's IP address
   * @returns Promise<boolean> true if verification successful
   * @throws UnauthorizedException if verification fails
   */
  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    if (!this.secretKey) {
      console.warn('Turnstile secret key is not configured - skipping verification');
      return true; // Allow in development when not configured
    }

    if (!token) {
      throw new UnauthorizedException('Turnstile token is required');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data: TurnstileVerifyResponse = await response.json();

      if (!data.success) {
        console.error('Turnstile verification failed:', data['error-codes']);
        throw new UnauthorizedException(
          'Security verification failed. Please try again.',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Turnstile verification error:', error);
      throw new UnauthorizedException(
        'Security verification failed. Please try again.',
      );
    }
  }

  /**
   * Check if Turnstile is enabled (secret key is configured)
   */
  isEnabled(): boolean {
    return !!this.secretKey;
  }
}
