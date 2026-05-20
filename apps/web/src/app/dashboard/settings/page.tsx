'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Key, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setProfileSettings } = useUserStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email] = useState(user?.email || ''); // Non-editable
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setProfileSettings({ username: user.username, email: user.email });
    }
  }, [user, setProfileSettings]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfileSettings({ username });
    toast.success('Profile updated successfully');
    setIsSaving(false);
  };

  const handleRequestOtp = async () => {
    setIsOtpLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/change-password/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification code');
      }

      setIsOtpSent(true);
      toast.info('Verification code sent to your email');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/change-password/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully. Please log in again.');
      setTimeout(() => {
        const { clear } = require('@/lib/auth').tokenStorage;
        clear();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">Profile Settings</h1>
          <p className="mt-1 text-sm text-[#626260] dark:text-[#a1a1aa]">Manage your personal information and account security.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 flex flex-col items-center text-center space-y-5 shadow-none">
              <div className="h-20 w-20 rounded-2xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center shadow-sm">
                <User className="h-10 w-10 text-[#7b7b78] dark:text-[#71717a]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[#111111] dark:text-[#f4f4f5] tracking-tight">{username || 'User'}</h3>
                <p className="text-xs text-[#626260] dark:text-[#a1a1aa] font-medium">{email}</p>
              </div>
              <Badge variant="secondary" className="capitalize border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5] px-3 py-1 font-bold tracking-tight">
                {user?.role?.toLowerCase() || 'User'}
              </Badge>
            </div>

            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 space-y-5 shadow-none">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Appearance
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all text-xs font-semibold",
                    theme === 'light' 
                      ? "border-[#111111] bg-[#111111] text-[#ffffff] shadow-md" 
                      : "border-[#d3cec6] dark:border-[#27272a] bg-transparent text-[#626260] dark:text-[#a1a1aa] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]"
                  )}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all text-xs font-semibold",
                    theme === 'dark' 
                      ? "border-[#f4f4f5] bg-[#f4f4f5] text-[#09090b] shadow-md" 
                      : "border-[#d3cec6] dark:border-[#27272a] bg-transparent text-[#626260] dark:text-[#a1a1aa] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]"
                  )}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all text-xs font-semibold",
                    theme === 'system' 
                      ? "border-[#4f46e5] bg-[#4f46e5] text-[#ffffff] shadow-md" 
                      : "border-[#d3cec6] dark:border-[#27272a] bg-transparent text-[#626260] dark:text-[#a1a1aa] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]"
                  )}
                >
                  <Monitor className="h-4 w-4" />
                  <span>System Preference</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            {/* General Info */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                  <User className="h-4 w-4" /> Personal Information
                </h2>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Username</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Email Address (Read-only)</Label>
                    <div className="flex items-center h-9 w-full rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/50 dark:bg-[#09090b]/50 px-3 py-1 text-sm text-[#626260] dark:text-[#a1a1aa] cursor-not-allowed font-medium italic">
                      <Mail className="mr-2 h-3.5 w-3.5 opacity-50" />
                      {email}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold px-6 shadow-sm">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                  <Shield className="h-4 w-4" /> Security & Password
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {!isChangingPassword ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">Password</h3>
                      <p className="text-xs text-[#626260] dark:text-[#a1a1aa] leading-relaxed">Change your password regularly to keep your account secure.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)} className="border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] font-bold whitespace-nowrap shadow-sm">
                      <Key className="mr-2 h-3.5 w-3.5" /> Change Password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="curr-pass" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Current Password</Label>
                        <Input 
                          id="curr-pass" 
                          type="password" 
                          required 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-pass" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">New Password</Label>
                        <Input 
                          id="new-pass" 
                          type="password" 
                          required 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conf-pass" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Confirm New Password</Label>
                        <Input 
                          id="conf-pass" 
                          type="password" 
                          required 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                        />
                      </div>
                    </div>

                    <div className="pt-4 pb-2 space-y-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#f4f4f5]">
                          Identity Verification (OTP)
                        </Label>
                        {isOtpSent && <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Sent</Badge>}
                      </div>
                      
                      <div className="flex gap-3">
                        <Input 
                          placeholder="6-digit code" 
                          className="max-w-[160px] text-center font-mono tracking-widest bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]" 
                          required={isOtpSent}
                          disabled={!isOtpSent}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={handleRequestOtp}
                          disabled={isOtpLoading || isOtpSent}
                          className="border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] text-[#111111] dark:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] font-bold shadow-sm"
                        >
                          {isOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isOtpSent ? 'Resend' : 'Send Code'}
                        </Button>
                      </div>
                      <p className="text-[10px] text-[#626260] dark:text-[#a1a1aa] leading-relaxed italic">A unique verification code will be sent to your registered email address to authorize this change.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
                      <Button type="button" variant="ghost" onClick={() => {
                        setIsChangingPassword(false);
                        setIsOtpSent(false);
                        setOtp('');
                      }} className="text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] font-bold">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving || !isOtpSent} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold px-6 shadow-sm">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Password Change
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) {
  const variants: any = {
    default: 'bg-[#111111] text-[#ffffff] dark:bg-[#f4f4f5] dark:text-[#09090b]',
    secondary: 'bg-[#f5f1ec] text-[#111111] dark:bg-[#18181b] dark:text-[#f4f4f5]',
    outline: 'border border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5]',
  };
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
