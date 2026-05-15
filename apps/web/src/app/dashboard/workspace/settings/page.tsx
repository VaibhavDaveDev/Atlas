'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
          <p className="text-muted-foreground">Manage your workspace members and preferences.</p>
        </div>

        <div className="grid gap-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Invite Members
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleInviteClick} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Workspace Role</Label>
                    <select
                      id="role"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="USER" className="bg-background">User</option>
                      <option value="MANAGER" className="bg-background">Manager</option>
                      <option value="ADMIN" className="bg-background">Admin</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                    {success}
                  </p>
                )}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Invitation
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Role Change Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" /> Confirm Role Change
              </DialogTitle>
              <DialogDescription className="pt-2">
                <span className="font-semibold text-foreground">{email}</span> is already a member of this workspace with the <span className="font-semibold text-foreground">{existingMember?.role}</span> role.
                <br /><br />
                Inviting them with the <span className="font-semibold text-primary">{role}</span> role will update their permissions once they accept. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={sendInvite} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
