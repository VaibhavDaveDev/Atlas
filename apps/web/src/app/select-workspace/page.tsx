'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPendingInvites, acceptInvite } from '@/lib/auth';
import {
  ChevronRight,
  Crown,
  Shield,
  Briefcase,
  User,
  Eye,
  Loader2,
  MailWarning,
  Clock,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/lib/auth';

const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  OWNER: { label: 'Owner', icon: Crown, color: 'text-amber-500' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-500' },
  MANAGER: { label: 'Manager', icon: Briefcase, color: 'text-violet-500' },
  USER: { label: 'Member', icon: User, color: 'text-slate-500' },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'text-slate-400' },
};

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  SUSPENDED: 'destructive',
  CANCELLED: 'secondary',
};

function WorkspaceCard({
  workspace,
  onSelect,
  isLoading,
}: {
  workspace: Workspace;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  const role = roleConfig[workspace.role] ?? roleConfig.USER;
  const RoleIcon = role.icon;
  const isActive = workspace.status === 'ACTIVE';

  return (
    <button
      onClick={() => onSelect(workspace.workspaceId)}
      disabled={isLoading || !isActive}
      className={cn(
        'group w-full rounded-xl border bg-card text-left p-5 transition-all duration-200',
        'hover:border-primary/40 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'flex items-center gap-4',
      )}
    >
      {/* Workspace avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg select-none">
        {workspace.workspaceName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{workspace.workspaceName}</span>
          <Badge variant={statusVariant[workspace.status] ?? 'secondary'} className="text-[10px] py-0">
            {workspace.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">@{workspace.subdomain}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
          <RoleIcon className={cn('h-3 w-3', role.color)} />
          <span className="text-muted-foreground">{role.label}</span>
          {workspace.department && (
            <>
              <span className="text-border">·</span>
              <span className="text-muted-foreground">{workspace.department}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
    </button>
  );
}

export default function SelectWorkspacePage() {
  const { user, workspaces, selectWorkspace, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Pending Invites state
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && workspaces.length === 0) {
      getPendingInvites()
        .then((res) => {
          if (res.success) setInvites(res.data);
          setLoadingInvites(false);
        })
        .catch(() => setLoadingInvites(false));
    } else {
      setLoadingInvites(false);
    }
  }, [user, workspaces]);

  const handleSelect = async (workspaceId: string) => {
    setSelectingId(workspaceId);
    setError('');
    try {
      await selectWorkspace(workspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select workspace');
      setSelectingId(null);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    setAcceptingToken(token);
    setError('');
    try {
      await acceptInvite(token);
      // Reload page to fetch new workspaces via AuthContext
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
      setAcceptingToken(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo + header */}
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
          <h1 className="text-2xl font-bold">Select workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back,{' '}
            <span className="font-medium text-foreground">{user?.username}</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Workspace list */}
        <div className="space-y-4">
          {workspaces.length === 0 ? (
            <div className="space-y-4">
              {/* Pending Invites */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  Pending Invites
                </h2>
                {loadingInvites ? (
                  <div className="rounded-xl border border-border bg-card/50 p-6 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : invites.length > 0 ? (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-sm truncate">{invite.workspace.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Invited by {invite.invitedBy.username || invite.invitedBy.email}</p>
                          <Badge variant="secondary" className="mt-2 text-[10px] py-0">{invite.role}</Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvite(invite.token)}
                          disabled={acceptingToken === invite.token}
                        >
                          {acceptingToken === invite.token ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Check className="h-3 w-3 mr-1.5" />}
                          Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                    <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">No pending invites</p>
                  </div>
                )}
              </div>

              {/* Action Required Message */}
              <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <MailWarning className="mx-auto mb-3 h-10 w-10 text-amber-500/80" />
                <h3 className="font-semibold mb-2">Action Required</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  You haven&apos;t been added to any workspace yet. Please wait for your IT or HR admin to assign you a role and invite you to your workspace.
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>Need help? Contact support:</p>
                  <p className="font-medium text-primary">support@atlas.amdox.in</p>
                  <p className="font-medium text-primary">hr@atlas.amdox.in</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Your Workspaces
              </h2>
              {workspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.workspaceId}
                  workspace={ws}
                  onSelect={handleSelect}
                  isLoading={selectingId !== null}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Signed in as <span className="font-medium">{user?.email}</span>
        </p>

        {/* Logout Button */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
