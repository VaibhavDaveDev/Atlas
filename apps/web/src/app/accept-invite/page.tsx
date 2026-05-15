'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvite, tokenStorage } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Stage = 'loading' | 'success' | 'error' | 'unauthenticated';

// Inner component using useSearchParams — must be inside <Suspense>
function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const token = searchParams.get('token');

  const [stage, setStage] = useState<Stage>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setStage('error');
      setErrorMessage('Invalid invite link — no token found.');
      return;
    }

    if (!user) {
      sessionStorage.setItem('pendingInviteToken', token);
      setStage('unauthenticated');
      return;
    }

    if (attempted.current) return;
    attempted.current = true;

    const accept = async () => {
      try {
        const result = await acceptInvite(token);
        // Invalidate the workspaces cache so select-workspace re-fetches from server
        tokenStorage.setWorkspaces([]);
        setWorkspaceName(result?.workspace?.name || '');
        setStage('success');

        setTimeout(() => {
          router.push('/select-workspace');
        }, 2000);
      } catch (err) {
        setStage('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to accept the invite. It may have expired.',
        );
      }
    };

    void accept();
  }, [authLoading, user, token, router]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo-mark-light-nobg.PNG"
            alt="Atlas ERP"
            width={40}
            height={40}
            className="block dark:hidden"
            priority
          />
          <Image
            src="/images/logo-mark-dark-nobg.PNG"
            alt="Atlas ERP"
            width={40}
            height={40}
            className="hidden dark:block"
            priority
          />
        </div>

        {/* Loading */}
        {stage === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="text-xl font-bold">Accepting your invite…</h1>
            <p className="text-sm text-muted-foreground">Please wait a moment.</p>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="text-xl font-bold">You&apos;re in!</h1>
            <p className="text-sm text-muted-foreground">
              {workspaceName ? `Welcome to ${workspaceName}.` : 'Welcome to your new workspace.'}{' '}
              Redirecting you now…
            </p>
          </div>
        )}

        {/* Error */}
        {stage === 'error' && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-bold">Couldn&apos;t accept invite</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/select-workspace">Go to workspace picker</Link>
            </Button>
          </div>
        )}

        {/* Not logged in */}
        {stage === 'unauthenticated' && (
          <div className="space-y-4">
            <LogIn className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-xl font-bold">Sign in to accept this invite</h1>
            <p className="text-sm text-muted-foreground">
              You need to be logged in to accept a workspace invite. Your invite token has been
              saved — you&apos;ll be taken back here after you sign in.
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href={`/login?redirect=/accept-invite?token=${token}`}>
                Sign in and continue
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href={`/register?redirect=/accept-invite?token=${token}`}
                className="text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Outer page wraps the inner component in Suspense (required by Next.js 15 for useSearchParams)
export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
