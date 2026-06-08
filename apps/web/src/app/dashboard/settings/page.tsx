'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Key, Loader2, Moon, Sun, Monitor, Globe, Plus, Bell, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'sonner';
import { cn, md5 } from '@/lib/utils';
import { API_BASE } from '@/lib/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { authClient } from '@/lib/auth-client';

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setProfileSettings } = useUserStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email] = useState(user?.email || ''); // Non-editable
  const [avatar, setAvatar] = useState(user?.image || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user?.username || 'user'}`);
  const [retentionDays, setRetentionDays] = useState(user?.notificationRetentionDays?.toString() || '30');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

  // 2FA state
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [show2faDialog, setShow2faDialog] = useState(false);
  const [show2faSetupStep, setShow2faSetupStep] = useState<'password' | 'qr' | 'backup'>('password');
  const [qrCode, setQrCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [is2faLoading, setIs2faLoading] = useState(false);
  const [showDisable2faDialog, setShowDisable2faDialog] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState('');

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      setIs2faEnabled(!!(session.user as any).twoFactorEnabled);
    }
  }, [session]);

  useEffect(() => {
    // Check if the user was redirected here because their workspace requires MFA
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reason') === 'mfa_setup_required') {
        // Automatically open the 2FA dialog
        setShow2faDialog(true);
        setShow2faSetupStep('password');
        toast.warning('Your workspace requires you to set up Two-Factor Authentication.', {
          duration: 10000,
        });
        
        // Clean up the URL to prevent reopening on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const handleEnable2fa = async () => {
    if (!twoFaPassword) {
      toast.error('Password is required to enable 2FA');
      return;
    }
    
    setIs2faLoading(true);
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: twoFaPassword,
      });
      if (error) throw error;
      setQrCode(data.totpURI);
      setShow2faSetupStep('qr');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enable 2FA. Check your password.');
    } finally {
      setIs2faLoading(false);
    }
  };

  const handleVerify2fa = async () => {
    setIs2faLoading(true);
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode,
      });
      if (error) throw error;
      
      const backupCodesRes = await authClient.twoFactor.generateBackupCodes({
        password: twoFaPassword,
      });
      if (backupCodesRes.data) {
        setBackupCodes(backupCodesRes.data.backupCodes);
      }
      setIs2faEnabled(true);
      setShow2faSetupStep('backup');
      toast.success('Two-factor authentication enabled successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIs2faLoading(false);
    }
  };

  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2faPassword) return;
    
    setIs2faLoading(true);
    try {
      const { error } = await authClient.twoFactor.disable({ password: disable2faPassword });
      if (error) throw error;
      setIs2faEnabled(false);
      setShowDisable2faDialog(false);
      setDisable2faPassword('');
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIs2faLoading(false);
    }
  };

  const handle2faDialogOpenChange = (open: boolean) => {
    setShow2faDialog(open);
    if (open) {
      setShow2faSetupStep('password');
      setTwoFaPassword('');
      setTwoFactorCode('');
      setQrCode('');
      setBackupCodes([]);
    } else {
      setTwoFaPassword('');
      setTwoFactorCode('');
    }
  };

  const handleClose2faDialog = () => {
    handle2faDialogOpenChange(false);
  };

  // Gravatar URL generation
  const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email.toLowerCase().trim())}?s=200&d=identicon`;
  const isUsingGravatar = avatar.includes('gravatar.com');

  const diceBearSeeds = [
    'Felix', 'Aneka', 'Milo', 'Luna', 'Jack', 'Mia', 'Oliver', 'Sophie', 
    'Charlie', 'Lily', 'Leo', 'Zoe', 'Max', 'Chloe', 'Jasper', 'Bella',
    'Oscar', 'Daisy', 'Toby', 'Ruby', 'Simba', 'Nala', 'Rocky', 'Coco',
    'Arlo', 'Willow', 'Finn', 'Ivy', 'Archie', 'Hazel'
  ];

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
    
    try {
      const response = await fetch(`${API_BASE}/user/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          username,
          image: avatar,
          notificationRetentionDays: parseInt(retentionDays, 10)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      const responseData = await response.json();
      const updatedUser = responseData.data || responseData;
      
      updateUser({
        ...updatedUser,
        notificationRetentionDays: parseInt(retentionDays, 10)
      });
      setProfileSettings({ username, avatar: updatedUser.image });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestOtp = async () => {
    setIsOtpLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password/request`, {
        method: 'POST',
        credentials: 'include',
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
      const response = await fetch(`${API_BASE}/auth/change-password/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
              <div className="h-24 w-24 rounded-full bg-[#fcfaf8] dark:bg-[#e2e2e2] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center shadow-sm overflow-hidden relative group transition-all">
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              </div>
              
              <div className="w-full pt-4 border-t border-[#f5f1ec] dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a] text-left">Choose Avatar</p>
                  
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setAvatar(gravatarUrl)}
                      className={cn(
                        "p-1.5 rounded-md border transition-all",
                        isUsingGravatar ? "bg-[#111111] border-[#111111] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]" : "border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]"
                      )}
                      title="Use Gravatar"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </button>
                    <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                      <DialogTrigger asChild>
                        <button className="p-1.5 rounded-md border border-[#d3cec6] dark:border-[#27272a] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] transition-all">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Select an Avatar</DialogTitle>
                          <DialogDescription>Choose a style that represents you. Powered by DiceBear.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] mt-4 pr-4">
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 p-1">
                            {diceBearSeeds.map((seed) => {
                              const url = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
                              return (
                                <button
                                  key={seed}
                                  onClick={() => {
                                    setAvatar(url);
                                    setShowAvatarDialog(false);
                                  }}
                                  className={cn(
                                    "aspect-square rounded-xl border-2 transition-all p-1 hover:scale-105",
                                    avatar === url ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-transparent bg-[#f5f1ec] dark:bg-[#1c1c1c] hover:border-[#d3cec6]"
                                  )}
                                >
                                  <img src={url} alt={seed} className="w-full h-full" />
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {diceBearSeeds.slice(0, 8).map((seed) => {
                    const avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setAvatar(avatarUrl)}
                        className={cn(
                          "h-10 w-10 rounded-lg border flex items-center justify-center transition-all overflow-hidden bg-[#f5f1ec] dark:bg-[#e2e2e2]",
                          avatar === avatarUrl
                            ? "border-[#111111] dark:border-[#f4f4f5] ring-2 ring-primary/10 shadow-sm"
                            : "border-transparent hover:border-[#d3cec6]"
                        )}
                      >
                        <img src={avatarUrl} alt={seed} className="h-full w-full" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-[#f5f1ec] dark:border-[#27272a] w-full text-center">
                <h3 className="font-semibold text-lg text-[#111111] dark:text-[#f4f4f5] tracking-tight">{username || 'User'}</h3>
                <p className="text-xs text-[#626260] dark:text-[#a1a1aa] font-medium mb-3">{email}</p>
                <Badge variant="secondary" className="capitalize border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5] px-3 py-1 font-bold tracking-tight">
                  {user?.role?.toLowerCase() || 'User'}
                </Badge>
              </div>
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

            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 space-y-5 shadow-none">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </h3>
              <div className="space-y-3">
                <Label htmlFor="retention" className="text-[10px] font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Keep notifications for</Label>
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger id="retention" className="w-full bg-transparent border-[#d3cec6] dark:border-[#27272a] text-xs font-semibold h-9">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214]">
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[#7b7b78] dark:text-[#71717a] leading-relaxed italic">
                  Notifications older than this will be automatically hidden from your view.
                </p>
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

            {/* Two-Factor Authentication */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                  <Key className="h-4 w-4" /> Two-Factor Authentication (2FA)
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">Status</h3>
                      {is2faEnabled ? (
                        <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Enabled</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                      Add an extra layer of security to your account using an authenticator app (TOTP).
                    </p>
                  </div>
                  {is2faEnabled && (
                    <Dialog open={showDisable2faDialog} onOpenChange={(open) => {
                      setShowDisable2faDialog(open);
                      if (!open) setDisable2faPassword('');
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={is2faLoading}
                          className="border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold whitespace-nowrap shadow-sm"
                        >
                          {is2faLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Shield className="mr-2 h-3.5 w-3.5" />} 
                          Disable 2FA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214]">
                        <DialogHeader>
                          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                          <DialogDescription>
                            Enter your current password to confirm you want to disable 2FA. This will make your account less secure.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDisable2fa} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="disable-2fa-password">Password</Label>
                            <Input
                              id="disable-2fa-password"
                              type="password"
                              value={disable2faPassword}
                              onChange={(e) => setDisable2faPassword(e.target.value)}
                              placeholder="Enter your password"
                              required
                              className="border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                            />
                          </div>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setShowDisable2faDialog(false);
                                setDisable2faPassword('');
                              }}
                              className="border-[#d3cec6] dark:border-[#27272a] hover:bg-[#e8e4dc] dark:hover:bg-[#1c1c1f]"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={is2faLoading || !disable2faPassword}
                              className="bg-red-600 hover:bg-red-700 text-white border-transparent dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
                            >
                              {is2faLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Disable 2FA
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {!is2faEnabled && (
                    <Dialog open={show2faDialog} onOpenChange={handle2faDialogOpenChange}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={is2faLoading}
                          className="border-[#111111] dark:border-[#f4f4f5] text-[#111111] dark:text-[#f4f4f5] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] font-bold whitespace-nowrap shadow-sm"
                        >
                          {is2faLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Plus className="mr-2 h-3.5 w-3.5" />} 
                          Enable 2FA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214]">
                        {show2faSetupStep === 'password' && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                              <DialogDescription>
                                Enter your current password to continue setting up 2FA.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="twofa-current-password" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">
                                  Current Password
                                </Label>
                                <Input 
                                  id="twofa-current-password"
                                  type="password"
                                  placeholder="Enter your password"
                                  value={twoFaPassword}
                                  onChange={(e) => setTwoFaPassword(e.target.value)}
                                  className="bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                                  autoFocus
                                />
                              </div>
                              <Button 
                                className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-black font-bold"
                                onClick={handleEnable2fa}
                                disabled={is2faLoading || !twoFaPassword}
                              >
                                {is2faLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue
                              </Button>
                            </div>
                          </>
                        )}

                        {show2faSetupStep === 'qr' && (
                          <>
                            <DialogHeader>
                              <DialogTitle>Scan QR Code</DialogTitle>
                              <DialogDescription>
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {qrCode && (
                                <div className="flex justify-center p-4 bg-white rounded-lg border border-[#d3cec6]">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} 
                                    alt="2FA QR Code" 
                                    className="w-48 h-48" 
                                  />
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label htmlFor="2fa-code" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">
                                  Verification Code
                                </Label>
                                <Input 
                                  id="2fa-code"
                                  type="text"
                                  placeholder="000000"
                                  value={twoFactorCode}
                                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                  className="text-center font-mono tracking-[0.5em] text-lg bg-transparent border-[#d3cec6] dark:border-[#27272a]"
                                  maxLength={6}
                                  autoComplete="off"
                                />
                              </div>
                              
                              <Button 
                                className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-black font-bold"
                                onClick={handleVerify2fa}
                                disabled={is2faLoading || twoFactorCode.length !== 6}
                              >
                                {is2faLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Activate
                              </Button>
                            </div>
                          </>
                        )}

                        {show2faSetupStep === 'backup' && (
                          <>
                            <DialogHeader>
                              <DialogTitle className="text-xl">Save Your Backup Codes</DialogTitle>
                              <DialogDescription className="text-[#626260] dark:text-[#a1a1aa]">
                                Store these backup codes securely. You can use them to access your account if you lose your authenticator device. Each code can only be used once.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="bg-[#f5f1ec] dark:bg-[#18181b] p-4 rounded-xl border border-[#d3cec6] dark:border-[#27272a] max-h-60 overflow-y-auto">
                                <div className="flex flex-col gap-3 font-mono text-xs md:text-sm">
                                  {backupCodes.map((code, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white dark:bg-[#09090b] p-3 rounded-md border border-[#e8e4dc] dark:border-[#27272a]">
                                      <span className="text-[#111111] dark:text-[#f4f4f5] select-all break-all pr-4">{code}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-[#626260] hover:text-[#111111] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5] shrink-0"
                                        onClick={() => {
                                          navigator.clipboard.writeText(code);
                                          toast.success('Copied to clipboard');
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-3">
                                <Button 
                                  variant="outline"
                                  className="w-full border-[#d3cec6] dark:border-[#27272a] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]"
                                  onClick={() => {
                                    navigator.clipboard.writeText(backupCodes.join('\n'));
                                    toast.success('All backup codes copied to clipboard');
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy All Codes
                                </Button>

                                <Button 
                                  className="w-full bg-[#111111] dark:bg-[#f4f4f5] text-white dark:text-black font-semibold"
                                  onClick={handleClose2faDialog}
                                >
                                  I have saved my backup codes
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {backupCodes.length > 0 && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Save your backup codes</h4>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">
                      If you lose access to your authenticator app, these codes are the ONLY way to access your account.
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className="bg-white/50 dark:bg-black/20 p-1.5 rounded text-center border border-amber-200/50 dark:border-amber-900/30">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px] font-bold bg-white dark:bg-black/20 border-amber-200 dark:border-amber-900/50"
                      onClick={() => {
                        const text = backupCodes.join('\n');
                        navigator.clipboard.writeText(text);
                        toast.success('Backup codes copied to clipboard');
                      }}
                    >
                      Copy Codes
                    </Button>
                  </div>
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
