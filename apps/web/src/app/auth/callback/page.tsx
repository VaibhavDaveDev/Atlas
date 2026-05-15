'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import * as authApi from '@/lib/auth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const err = searchParams.get('error');

        if (err) {
          throw new Error(searchParams.get('error_description') || 'Authentication failed');
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state');
        }

        // IMPORTANT: Clear any stale session before storing new tokens.
        // This prevents the "wrong user" bug where old tokens persist.
        authApi.tokenStorage.clear();

        // Call backend to exchange code for tokens
        const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;
        const res = await fetch(`${API_BASE}/auth/google/callback?code=${code}&state=${state}`);
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.message || 'Failed to authenticate with Google');
        }

        // The backend spreads the result directly (after our fix), but
        // the TransformInterceptor still wraps everything in { data: ... }
        const payload = responseData.data || responseData;

        if (!payload.accessToken || !payload.user) {
          throw new Error('Invalid response from server. Please try again.');
        }

        // Store new tokens atomically
        authApi.tokenStorage.setAccessToken(payload.accessToken);
        authApi.tokenStorage.setRefreshToken(payload.refreshToken);
        authApi.tokenStorage.setUser(payload.user);

        // Validate redirectUrl to prevent Open Redirect vulnerability
        let redirectUrl = payload.redirectUrl || '/select-workspace';
        if (!redirectUrl.startsWith('/') || redirectUrl.startsWith('//')) {
          console.warn('Invalid redirectUrl detected:', redirectUrl);
          redirectUrl = '/select-workspace';
        }

        // Use window.location.href instead of router.push so the page fully
        // re-mounts and AuthContext re-reads the new tokens from localStorage.
        window.location.href = redirectUrl;
      } catch (err) {
        console.error('Google OAuth Callback Error:', err);
        // Clear any partial tokens on failure
        authApi.tokenStorage.clear();
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // Redirect back to login after 3 seconds on error
        setTimeout(() => { window.location.href = '/login'; }, 3000);
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once only — searchParams won't change for a callback page

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 max-w-sm">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Failed</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-4">Redirecting back to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h2 className="text-lg font-medium">Authenticating...</h2>
      <p className="text-sm text-muted-foreground">Please wait while we log you in.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
