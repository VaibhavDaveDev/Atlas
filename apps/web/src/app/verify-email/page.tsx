'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;
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
    if (!/^[0-9A-Fa-f]?$/.test(value)) return;
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
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? 'Verification failed');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    try {
      await fetch(`${API_BASE}/auth/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold">Email verified!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is now active. Sign in to get started.
        </p>
        <Button className="mt-6 w-full" asChild>
          <Link href="/login">Sign in to Atlas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/images/logo-mark-light-nobg.PNG"
          alt="Atlas ERP"
          width={40}
          height={40}
          className="mb-4 block dark:hidden"
          priority
        />
        <Image
          src="/images/logo-mark-dark-nobg.PNG"
          alt="Atlas ERP"
          width={40}
          height={40}
          className="mb-4 hidden dark:block"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          We sent a 6-character code to{' '}
          <span className="font-medium text-foreground">{email || 'your email'}</span>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
                  'h-12 w-11 rounded-lg border bg-background text-center text-lg font-bold tracking-widest shadow-sm outline-none transition-all',
                  'focus:border-primary focus:ring-2 focus:ring-ring',
                  char ? 'border-primary/50' : 'border-input',
                  'disabled:opacity-50',
                )}
                aria-label={`Code digit ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || fullCode.length !== CODE_LENGTH}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Verifying…' : 'Verify email'}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>Didn&apos;t receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isResending && <RefreshCw className="h-3 w-3 animate-spin" />}
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
