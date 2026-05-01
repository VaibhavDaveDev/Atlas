'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { resetPassword } from '@/lib/auth';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: '', color: 'bg-border' },
    { score: 1, label: 'Weak', color: 'bg-destructive' },
    { score: 2, label: 'Fair', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-yellow-500' },
    { score: 4, label: 'Strong', color: 'bg-emerald-500' },
  ];

  return levels[score] ?? levels[0];
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [resetSessionId] = useState(searchParams.get('session') ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strength.score < 4) {
      setError('Please choose a stronger password (uppercase, lowercase, number, special character).');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetSessionId, code.toUpperCase().trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
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
          <h1 className="text-2xl font-bold tracking-tight">Password reset!</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your password has been updated successfully. All existing sessions have been logged out for your security.
          </p>
          <div className="mt-6">
            <Button className="w-full" onClick={() => router.push('/login')}>
              Sign in with new password
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/forgot-password">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
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

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Enter the 6-digit code we emailed you and choose a new password.
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


              {/* Reset code */}
              <div className="space-y-1.5">
                <Label htmlFor="code">Reset code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="A1B2C3"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="font-mono tracking-widest text-center text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Check your inbox for the 6-character code (expires in 1 hour).
                </p>
              </div>

              {code.length === 6 && (
                <>
                  {/* New password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        maxLength={128}
                        disabled={isLoading}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {newPassword.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                'h-1 flex-1 rounded-full transition-all duration-300',
                                i <= strength.score ? strength.color : 'bg-border',
                              )}
                            />
                          ))}
                        </div>
                        {strength.label && (
                          <p className="text-xs text-muted-foreground">
                            Password strength:{' '}
                            <span
                              className={cn(
                                'font-medium',
                                strength.score === 1 && 'text-destructive',
                                strength.score === 2 && 'text-amber-500',
                                strength.score === 3 && 'text-yellow-500',
                                strength.score === 4 && 'text-emerald-500',
                              )}
                            >
                              {strength.label}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        className={cn(
                          'pr-10',
                          confirmPassword && confirmPassword !== newPassword && 'border-destructive',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || strength.score < 4 || newPassword !== confirmPassword || code.length < 6}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Resetting password…' : 'Reset password'}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
