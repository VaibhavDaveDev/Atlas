'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';
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
            Back to sign in
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
                  Check your email
                </h1>
                <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                  If <strong className="text-[#111111] dark:text-[#f4f4f5] font-medium">{email}</strong> is registered, we&apos;ve sent a 6-digit reset code to that address.
                </p>
                <div className="mt-8 space-y-3 w-full">
                  <Button 
                    className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
                    asChild
                  >
                    <Link href={`/reset-password?session=${encodeURIComponent(resetSessionId)}`}>
                      Enter reset code
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
                <p className="mt-6 text-xs text-[#7b7b78] dark:text-[#71717a]">
                  Didn&apos;t receive an email?{' '}
                  <button
                    onClick={() => { setSuccess(false); setEmail(''); }}
                    className="text-[#111111] dark:text-[#f4f4f5] font-semibold hover:underline"
                  >
                    Try again
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-none">
                  <Mail className="h-6 w-6 text-[#626260] dark:text-[#a1a1aa]" />
                </div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                  Forgot password?
                </h1>
                <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                  Enter your email and we&apos;ll send you a reset code.
                </p>

                {/* Card */}
                <div className="w-full mt-8 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-left shadow-none">
                  {error && (
                    <div className="mb-4 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">Email address</Label>
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
                        className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : 'Send reset code'}
                    </Button>
                  </form>
                </div>

                <p className="mt-6 text-center text-sm text-[#626260] dark:text-[#a1a1aa]">
                  Remember your password?{' '}
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
