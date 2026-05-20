'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

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

function RegisterContent() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const toastId = toast.loading('Creating your account...');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message ?? 'Registration failed');
      }
      setSuccess(true);
      toast.success('Registration successful!', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const toastId = toast.loading('Connecting to Google...');
    try {
      const res = await fetch(`${API_BASE}/auth/google`);
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.message || 'Failed to connect to authentication server');
      }
      
      const url = responseData.data?.url || responseData.url;
      
      if (url) {
        toast.success('Redirecting to Google...', { id: toastId });
        window.location.href = url;
      } else {
        throw new Error('Invalid response from authentication server');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Google signup';
      setError(message);
      toast.error(message, { id: toastId });
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
          <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
          We sent a verification code to <strong className="text-[#111111] dark:text-[#f4f4f5] font-medium">{email}</strong>. Enter it to activate your account.
        </p>
        <div className="mt-8 space-y-3">
          <Button 
            className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
            asChild
          >
            <Link href={`/verify-email?email=${encodeURIComponent(email)}`}>
              Enter verification code
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-[#626260] dark:text-[#a1a1aa] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] hover:text-[#111111] dark:hover:text-[#f4f4f5]" 
            asChild
          >
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Logo & Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo variant="mark" width={44} height={44} className="mb-4" />
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-[#626260] dark:text-[#a1a1aa]">
          Get started with Atlas ERP for free
        </p>
      </div>

      <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full bg-[#ffffff] hover:bg-[#f5f1ec] dark:bg-[#121214] dark:hover:bg-[#1c1c1f] border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5] font-medium transition-colors"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign up with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#e5e2db] dark:border-[#232326]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#ffffff] dark:bg-[#121214] px-2 text-[#7b7b78] dark:text-[#71717a]">
                Or create account with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_\-]+$"
                title="Letters, numbers, underscores and hyphens only"
                disabled={isLoading}
                autoFocus
                className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password Strength Meter */}
              {password.length > 0 && (
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

            <Button 
              type="submit" 
              className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : 'Create account'}
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-[#626260] dark:text-[#a1a1aa]">
        Already have an account?{' '}
        <Link 
          href="/login" 
          className="font-semibold text-[#111111] dark:text-[#f4f4f5] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
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
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
        <ThemeToggle />
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <Suspense fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
          </div>
        }>
          <RegisterContent />
        </Suspense>
      </div>

      {/* Empty footer area for visual balance */}
      <div className="py-4" />
    </div>
  );
}
