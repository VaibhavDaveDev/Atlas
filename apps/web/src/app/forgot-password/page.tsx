'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { forgotPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSessionId, setResetSessionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.data?.resetSessionId) {
        setResetSessionId(result.data.resetSessionId);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            If <strong className="text-foreground">{email}</strong> is registered, we&apos;ve sent a
            6-digit reset code to that address. It expires in 1 hour.
          </p>
          <div className="mt-6 space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/reset-password?session=${encodeURIComponent(resetSessionId)}`}>
                Enter reset code
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Didn&apos;t receive an email?{' '}
            <button
              onClick={() => { setSuccess(false); setEmail(''); }}
              className="text-primary hover:underline font-medium"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm animate-fade-in">
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

            {/* Icon */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              No worries! Enter your email and we&apos;ll send you a reset code.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Sending…' : 'Send reset code'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
