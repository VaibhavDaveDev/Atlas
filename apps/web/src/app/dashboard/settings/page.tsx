'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Key, Loader2, CheckCircle2, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useTheme } from 'next-themes';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { profileSettings, setProfileSettings } = useUserStore();
  
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
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and account security.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{username || 'User'}</h3>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user?.role?.toLowerCase() || 'User'}
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Appearance
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'}`}
                >
                  <Monitor className="h-4 w-4" />
                  <span className="text-[10px] font-medium">System</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* General Info */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Personal Information
                </h2>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email Address (Read-only)</Label>
                    <div className="flex items-center h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground cursor-not-allowed">
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      {email}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" /> Security
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {!isChangingPassword ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-medium">Password</h3>
                      <p className="text-xs text-muted-foreground">Change your password to keep your account secure.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                      <Key className="mr-2 h-3.5 w-3.5" /> Change Password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 animate-in slide-in-from-top-4 duration-200">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="curr-pass">Current Password</Label>
                        <Input 
                          id="curr-pass" 
                          type="password" 
                          required 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new-pass">New Password</Label>
                        <Input 
                          id="new-pass" 
                          type="password" 
                          required 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conf-pass">Confirm New Password</Label>
                        <Input 
                          id="conf-pass" 
                          type="password" 
                          required 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <Label className="flex items-center gap-2">
                        Verification Code (OTP)
                        {isOtpSent && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Sent</Badge>}
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="6-digit code" 
                          className="max-w-[150px]" 
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
                        >
                          {isOtpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isOtpSent ? 'Resend' : 'Send Code'}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">A security code will be sent to your registered email address.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => {
                        setIsChangingPassword(false);
                        setIsOtpSent(false);
                        setOtp('');
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving || !isOtpSent}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
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
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
