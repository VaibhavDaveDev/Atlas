'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

interface PasswordStrength {
  score: number; // 0–4
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
    { score: 0, label: '', color: 'bg-[#e5e2db] dark:bg-[#232326]' },
    { score: 1, label: 'Weak', color: 'bg-red-500' },
    { score: 2, label: 'Fair', color: 'bg-amber-500' },
    { score: 3, label: 'Good', color: 'bg-yellow-500' },
    { score: 4, label: 'Strong', color: 'bg-emerald-500' },
  ];

  return levels[score] ?? levels[0];
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email] = useState(searchParams.get('email') ?? '');
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
      setError('Please choose a stronger password.');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Resetting your password...');
    try {
      const { data, error } = await authClient.resetPassword({
        newPassword,
        token: code.toUpperCase().trim(),
      });

      if (error) {
        throw new Error(error.message ?? 'Failed to reset password');
      }

      setSuccess(true);
      toast.success('Password reset successfully!', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

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
          <Link href="/forgot-password">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo & Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="mark" width={44} height={44} className="mb-4" />

            {success ? (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                  Password reset!
                </h1>
                <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                  Your password has been updated successfully. All existing sessions have been logged out for your security.
                </p>
                <div className="mt-8 w-full">
                  <Button 
                    className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
                    onClick={() => router.push('/login')}
                  >
                    Sign in with new password
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-none">
                  <ShieldCheck className="h-6 w-6 text-[#626260] dark:text-[#a1a1aa]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                  Enter the 6-character code and choose a new password.
                </p>

                {/* Card */}
                <div className="w-full mt-8 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-left shadow-none">
                  {error && (
                    <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reset code */}
                    <div className="space-y-1.5">
                      <Label htmlFor="code" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Reset code</Label>
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
                        className="font-mono tracking-widest text-center text-lg bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                        autoFocus
                      />
                      <p className="text-xs text-[#7b7b78] dark:text-[#71717a]">
                        Check your inbox for the 6-character code.
                      </p>
                    </div>

                    {code.length === 6 && (
                      <>
                        {/* New password */}
                        <div className="space-y-1.5">
                          <Label htmlFor="new-password" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">New password</Label>
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
                              className="pr-10 bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7b78] dark:text-[#71717a] hover:text-[#111111] dark:hover:text-[#e4e4e7] transition-colors"
                              tabIndex={-1}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* Strength meter */}
                          {newPassword.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'h-1 flex-1 rounded-full transition-all duration-300',
                                      i <= strength.score ? strength.color : 'bg-[#e5e2db] dark:bg-[#232326]',
                                    )}
                                  />
                                ))}
                              </div>
                              {strength.label && (
                                <p className="text-xs text-[#7b7b78] dark:text-[#a1a1aa]">
                                  Password strength:{' '}
                                  <span className={cn('font-semibold', 
                                    strength.score === 1 && 'text-red-500',
                                    strength.score === 2 && 'text-amber-500',
                                    strength.score === 3 && 'text-yellow-500',
                                    strength.score === 4 && 'text-emerald-500'
                                  )}>
                                    {strength.label}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-1.5">
                          <Label htmlFor="confirm-password" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Confirm new password</Label>
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
                                'pr-10 bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]',
                                confirmPassword && confirmPassword !== newPassword && 'border-red-500 focus-visible:ring-red-500',
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b7b78] dark:text-[#71717a] hover:text-[#111111] dark:hover:text-[#e4e4e7] transition-colors"
                              tabIndex={-1}
                              aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                          )}
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md"
                      disabled={isLoading || strength.score < 4 || newPassword !== confirmPassword || code.length < 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting password…
                        </>
                      ) : 'Reset password'}
                    </Button>
                  </form>
                </div>

                <p className="mt-6 text-center text-sm text-[#626260] dark:text-[#a1a1aa]">
                  Remembered your password?{' '}
                  <Link 
                    href="/login" 
                    className="font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty footer area for visual balance */}
      <div className="py-4" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
