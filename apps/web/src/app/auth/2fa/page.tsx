'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { tokenStorage, getMyWorkspaces } from '@/lib/auth';

function TwoFactorForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setError('');
    setIsLoading(true);
    const toastId = toast.loading('Verifying code...');

    try {
      let result;
      if (isBackupMode) {
        result = await authClient.twoFactor.verifyBackupCode({ code });
      } else {
        result = await authClient.twoFactor.verifyTotp({ code });
      }

      if (result.error) {
        throw result.error;
      }

      // Sync session manually to ensure it's available for the next steps
      const sessionRes = await authClient.getSession();
      const token = sessionRes.data?.session?.token;
      
      if (token) {
        tokenStorage.setBetterAuthToken(token);
      }

      if (sessionRes.data?.user) {
        tokenStorage.setUser({
          id: sessionRes.data.user.id,
          email: sessionRes.data.user.email,
          username: (sessionRes.data.user as any).username || '',
          role: (sessionRes.data.user as any).globalRole || 'USER',
          verified: sessionRes.data.user.emailVerified,
          image: sessionRes.data.user.image,
        });
      }

      // Fetch workspaces to continue the login flow
      try {
        const workspacesRes = await getMyWorkspaces();
        tokenStorage.setWorkspaces(workspacesRes.data || []);
      } catch (wsErr) {
        console.warn('Failed to fetch workspaces after 2FA:', wsErr);
      }

      toast.success('Verification successful', { id: toastId });
      router.push('/select-workspace');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 h-12 w-12 rounded-full bg-[#f5f1ec] dark:bg-[#1c1c1f] flex items-center justify-center border border-[#d3cec6] dark:border-[#27272a]">
          <ShieldCheck className="h-6 w-6 text-[#111111] dark:text-[#f4f4f5]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
          Two-Factor Authentication
        </h1>
        <p className="mt-1.5 text-sm text-[#626260] dark:text-[#a1a1aa]">
          {isBackupMode 
            ? 'Enter one of your emergency backup codes.' 
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">
              {isBackupMode ? 'Backup Code' : 'Authentication Code'}
            </Label>
            <Input
              id="code"
              type="text"
              placeholder={isBackupMode ? 'e.g. backup code...' : '000000'}
              value={code}
              onChange={(e) => setCode(isBackupMode ? e.target.value : e.target.value.replace(/\D/g, ''))}
              required
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              maxLength={isBackupMode ? undefined : 6}
              className={`bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5] font-mono text-center tracking-widest ${!isBackupMode ? 'text-lg' : 'text-xs md:text-sm'}`}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md"
            disabled={isLoading || (isBackupMode ? code.trim().length === 0 : code.length !== 6)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : 'Verify'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-[#626260] dark:text-[#a1a1aa]"
            onClick={() => {
              setIsBackupMode(!isBackupMode);
              setCode('');
              setError('');
            }}
            disabled={isLoading}
          >
            {isBackupMode ? 'Use Authenticator App' : 'Use a Backup Code'}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-[#626260] dark:text-[#a1a1aa]">
        Lost access to your device?{' '}
        <a href="mailto:workspace.atlas@protonmail.com" className="font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline">
          Contact Support
        </a>
      </p>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex flex-col justify-between transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-[#626260] dark:text-[#a1a1aa] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5] transition-colors"
        >
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to login
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <Suspense fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
          </div>
        }>
          <TwoFactorForm />
        </Suspense>
      </div>

      <div className="py-8 flex justify-center">
        <p className="text-[10px] uppercase tracking-widest font-bold text-[#7b7b78] dark:text-[#71717a]">
          Support: <a href="mailto:workspace.atlas@protonmail.com" className="hover:text-[#111111] dark:hover:text-[#f4f4f5] transition-colors underline decoration-[#d3cec6] dark:decoration-[#27272a] underline-offset-4">workspace.atlas@protonmail.com</a>
        </p>
      </div>
    </div>
  );
}
