'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { tokenStorage, checkWorkspaceMember } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function WorkspaceSettingsPage() {
  const { workspace } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false);
  const [existingMember, setExistingMember] = useState<any>(null);

  const handleInviteClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !workspace) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user is already a member
      const checkRes = await checkWorkspaceMember(workspace.workspaceId, email);
      
      if (checkRes.isMember) {
        if (checkRes.role === role) {
          setError(`This person is already a member with the ${role} role.`);
          setIsLoading(false);
          return;
        }
        // Different role, show warning
        setExistingMember(checkRes);
        setShowConfirm(true);
        setIsLoading(false);
        return;
      }

      // Not a member, proceed with invite
      await sendInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!workspace) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/workspaces/${workspace.workspaceId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send invite');
      }

      setSuccess('Invite sent successfully!');
      setEmail('');
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">Workspace Settings</h1>
          <p className="mt-1 text-sm text-[#626260] dark:text-[#a1a1aa]">Manage your workspace members, roles, and organizational preferences.</p>
        </div>

        <div className="grid gap-8">
          <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5] flex items-center gap-2.5">
                <Users className="h-4 w-4" /> Invite New Members
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleInviteClick} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-transparent border-[#d3cec6] dark:border-[#27272a] focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">Workspace Role</Label>
                    <div className="relative">
                      <select
                        id="role"
                        className="flex h-9 w-full rounded-md border border-[#d3cec6] dark:border-[#27272a] bg-transparent px-3 py-1 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5] appearance-none"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="USER">User (Standard Access)</option>
                        <option value="MANAGER">Manager (Team Management)</option>
                        <option value="ADMIN">Admin (Full Control)</option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#7b7b78] dark:text-[#71717a]">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3 animate-in fade-in duration-200">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">✓</div>
                    {success}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isLoading} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold px-6 shadow-sm">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2.5" />}
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Role Change Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="rounded-2xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-amber-600 dark:text-amber-500 tracking-tight">
                <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                Confirm Role Update
              </DialogTitle>
              <DialogDescription className="pt-4 text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                <span className="font-bold text-[#111111] dark:text-[#f4f4f5] underline decoration-[#d3cec6] underline-offset-4">{email}</span> is already a member with the <Badge className="bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5] border-[#d3cec6] dark:border-[#27272a] ml-1">{existingMember?.role}</Badge> role.
                <br /><br />
                Sending this invitation will update their permissions to <span className="font-bold text-[#4f46e5] dark:text-[#818cf8] uppercase tracking-wider">{role}</span> once they accept.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:gap-0 pt-6 mt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
              <Button variant="ghost" onClick={() => setShowConfirm(false)} className="text-[#626260] dark:text-[#a1a1aa] font-bold hover:text-[#111111] dark:hover:text-[#f4f4f5]">Cancel</Button>
              <Button onClick={sendInvite} disabled={isLoading} className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold shadow-sm px-6">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm and Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border transition-colors",
      className
    )}>
      {children}
    </span>
  );
}
