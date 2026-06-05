'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptInvite, tokenStorage } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

type Stage = 'loading' | 'success' | 'error' | 'unauthenticated';

/**
 * Accept Invite Flow
 *
 * Two entry points:
 *
 * 1. Magic link email click:
 *    URL = /api/v1/auth/magic-link/verify?token=xxx&callbackURL=/accept-invite?workspaceId=yyy&email=zzz
 *    → BetterAuth verifies the token and signs the user in (creating account if needed)
 *    → Redirects to /accept-invite?workspaceId=yyy&email=zzz (no token param at this point)
 *    → We call acceptInvite() using workspaceId + the authenticated user's email
 *
 * 2. Legacy fallback (raw token links):
 *    URL = /accept-invite?token=xxx
 *    → If authenticated: call acceptInvite(token) directly
 *    → If not authenticated: redirect to login with the invite URL preserved
 */
function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  // Magic link flow params (set by BetterAuth after verifying the magic link)
  const workspaceId = searchParams.get('workspaceId');
  const inviteEmail = searchParams.get('email');

  // Legacy raw-token flow param
  const token = searchParams.get('token');

  const [stage, setStage] = useState<Stage>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    // ── Case 1: Magic link callback (workspaceId in URL — user is already signed in via magic link) ──
    if (workspaceId) {
      if (!user) {
        // Magic link should have signed the user in — but just in case, show unauthenticated
        setStage('unauthenticated');
        return;
      }

      if (attempted.current) return;
      attempted.current = true;

      const accept = async () => {
        try {
          // The magic link already authenticated the user. Now we just accept the invite
          // using the workspaceId embedded in the callback URL.
          const result = await acceptInvite(workspaceId);
          tokenStorage.setWorkspaces([]);
          setWorkspaceName(result?.workspace?.name || '');
          setStage('success');
          setTimeout(() => router.push('/select-workspace'), 2000);
        } catch (err) {
          setStage('error');
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Failed to accept the invite. It may have expired.',
          );
        }
      };

      void accept();
      return;
    }

    // ── Case 2: Legacy raw-token flow ─────────────────────────────────────────
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
        tokenStorage.setWorkspaces([]);
        setWorkspaceName(result?.workspace?.name || '');
        setStage('success');
        setTimeout(() => router.push('/select-workspace'), 2000);
      } catch (err) {
        setStage('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to accept the invite. It may have expired.',
        );
      }
    };

    void accept();
  }, [authLoading, user, token, workspaceId, inviteEmail, router]);

  const inviteUrl = workspaceId
    ? `/accept-invite?workspaceId=${workspaceId}&email=${encodeURIComponent(inviteEmail ?? '')}`
    : `/accept-invite?token=${token ?? ''}`;

  return (
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex flex-col justify-between transition-colors duration-300">
      {/* Top spacing */}
      <div className="py-4" />

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <div className="w-full max-w-sm text-center animate-fade-in">
          {/* Logo */}
          <Logo variant="mark" width={44} height={44} className="mx-auto mb-6" />

          {/* Loading Stage */}
          {stage === 'loading' && (
            <div className="w-full mt-6 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-8 text-center shadow-none flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                Accepting your invite…
              </h1>
              <p className="text-sm text-[#626260] dark:text-[#a1a1aa]">
                Please wait a moment.
              </p>
            </div>
          )}

          {/* Success Stage */}
          {stage === 'success' && (
            <div className="w-full mt-6 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-8 text-center shadow-none flex flex-col items-center justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                You&apos;re in!
              </h1>
              <p className="text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                {workspaceName ? `Welcome to ${workspaceName}.` : 'Welcome to your new workspace.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#7b7b78] dark:text-[#71717a] pt-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Redirecting you now…
              </div>
            </div>
          )}

          {/* Error Stage */}
          {stage === 'error' && (
            <div className="w-full mt-6 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-center shadow-none flex flex-col items-center justify-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                Couldn&apos;t accept invite
              </h1>
              <p className="text-sm text-red-600 dark:text-red-400 max-w-xs">
                {errorMessage}
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-2 border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]"
              >
                <Link href="/select-workspace">Go to workspace picker</Link>
              </Button>
            </div>
          )}

          {/* Unauthenticated Stage — shown only for legacy raw-token links */}
          {stage === 'unauthenticated' && (
            <div className="w-full mt-6 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-left shadow-none space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-none">
                  <LogIn className="h-6 w-6 text-[#626260] dark:text-[#a1a1aa]" />
                </div>
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                  Sign in to accept this invite
                </h1>
                <p className="text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                  You need to be logged in to accept this workspace invite.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md"
                >
                  <Link href={`/login?redirect=${encodeURIComponent(inviteUrl)}`}>
                    Sign in and continue
                  </Link>
                </Button>

                <p className="text-center text-xs text-[#7b7b78] dark:text-[#71717a]">
                  Don&apos;t have an account?{' '}
                  <Link
                    href={`/register?redirect=${encodeURIComponent(inviteUrl)}`}
                    className="font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="py-4" />
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
