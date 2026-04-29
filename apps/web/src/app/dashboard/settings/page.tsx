'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { tokenStorage } from '@/lib/auth';

export default function SettingsPage() {
  const { workspace } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    setIsLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspace.workspaceId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invite');
      }

      setSuccess('Invite sent successfully!');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace || !['OWNER', 'ADMIN'].includes(workspace.role)) {
    return (
      <AppShell>
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-destructive">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">You do not have permission to view settings.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Workspace Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your workspace members and preferences.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Invite Members Card */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Invite Members</h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="ADMIN" className="bg-background">Admin</option>
                    <option value="MANAGER" className="bg-background">Manager</option>
                    <option value="USER" className="bg-background">User</option>
                    <option value="VIEWER" className="bg-background">Viewer</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    System roles control access permissions, not job titles.
                  </p>
                </div>

                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                {success && <p className="text-sm text-emerald-500 font-medium">{success}</p>}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Invitation
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
