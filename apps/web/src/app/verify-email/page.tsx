'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

const CODE_LENGTH = 6;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9A-Z]?$/i.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/\s/g, '');
    if (pasted.length === CODE_LENGTH) {
      setCode(pasted.split(''));
      inputRefs.current[CODE_LENGTH - 1]?.focus();
    }
    e.preventDefault();
  };

  const fullCode = code.join('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length !== CODE_LENGTH) return;
    setError('');
    setIsLoading(true);
    const toastId = toast.loading('Verifying your email...');
    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: fullCode,
      });

      if (error) {
        throw new Error(error.message ?? 'Verification failed');
      }

      setSuccess(true);
      toast.success('Email verified successfully!', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    const toastId = toast.loading('Sending a new code...');
    try {
      const { data, error } = await authClient.emailOTP.sendVerificationOtp({
        email,
        type: 'email-verification',
      });

      if (error) {
        throw new Error(error.message ?? 'Failed to resend verification code');
      }

      toast.success('New verification code sent!', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
          Email verified!
        </h1>
        <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
          Your account is now active. Sign in to get started.
        </p>
        <div className="mt-8">
          <Button 
            className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
            asChild
          >
            <Link href="/login">Sign in to Atlas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center">
      {/* Logo */}
      <Logo variant="mark" width={44} height={44} className="mb-4" />
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">Check your email</h1>
      <p className="mt-1.5 text-sm text-[#626260] dark:text-[#a1a1aa] max-w-xs text-center">
        We sent a 6-character code to{' '}
        <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{email || 'your email'}</span>
      </p>

      {/* Card */}
      <div className="w-full mt-8 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-left shadow-none">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {/* OTP inputs */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((char, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isLoading}
                className={cn(
                  'h-12 w-11 rounded-lg border text-center text-lg font-bold tracking-widest outline-none transition-all bg-transparent shadow-none',
                  'focus:border-[#111111] dark:focus:border-[#f4f4f5] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5]',
                  char 
                    ? 'border-[#111111] dark:border-[#f4f4f5] text-[#111111] dark:text-[#f4f4f5]' 
                    : 'border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5]',
                  'disabled:opacity-50',
                )}
                aria-label={`Code digit ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md"
            disabled={isLoading || fullCode.length !== CODE_LENGTH}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : 'Verify email'}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-[#7b7b78] dark:text-[#71717a]">
          <span>Didn&apos;t receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-1 font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline disabled:opacity-50"
          >
            {isResending && <RefreshCw className="h-3 w-3 animate-spin mr-0.5" />}
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-[#626260] dark:text-[#a1a1aa]">
        <Link href="/login" className="font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex flex-col justify-between transition-colors duration-300">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="text-[#626260] dark:text-[#a1a1aa] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5] transition-colors"
        >
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <div className="w-full max-w-sm">
          <Suspense fallback={
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-8 text-center shadow-none flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                Loading verification...
              </h1>
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>

      {/* Empty footer area for visual balance */}
      <div className="py-4" />
    </div>
  );
}
