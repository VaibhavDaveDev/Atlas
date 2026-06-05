'use client';

import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export interface TurnstileWidgetHandle {
  reset: () => void;
  getToken: () => string | undefined;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire, className }, ref) => {
    const turnstileRef = useRef<TurnstileInstance>(null);
    // Use test key if not configured (always passes in development)
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset();
      },
      getToken: () => {
        return turnstileRef.current?.getResponse();
      },
    }));

    return (
      <div className={className}>
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={onSuccess}
          onError={onError}
          onExpire={onExpire}
          options={{
            theme: 'auto',
            size: 'normal',
          }}
        />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
