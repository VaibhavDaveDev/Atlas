import { SetMetadata } from '@nestjs/common';

export const TURNSTILE_KEY = 'turnstile';

/**
 * Decorator to enable Turnstile verification on an endpoint
 * Usage: @RequireTurnstile() on controller method
 */
export const RequireTurnstile = () => SetMetadata(TURNSTILE_KEY, true);

/**
 * Decorator to skip Turnstile verification on an endpoint
 * Usage: @SkipTurnstile() on controller method
 */
export const SkipTurnstile = () => SetMetadata(TURNSTILE_KEY, false);
