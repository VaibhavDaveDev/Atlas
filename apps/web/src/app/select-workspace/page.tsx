'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getPendingInvites, acceptInvite, getMyWorkspaces, tokenStorage } from '@/lib/auth';
import {
  ChevronRight,
  Crown,
  Shield,
  Briefcase,
  User,
  Eye,
  Loader2,
  MailWarning,
  Check,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/lib/auth';
import { Logo } from '@/components/common/Logo';

const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  OWNER: { label: 'Owner', icon: Crown, color: 'text-amber-600 dark:text-amber-500' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-600 dark:text-blue-500' },
  MANAGER: { label: 'Manager', icon: Briefcase, color: 'text-violet-600 dark:text-violet-500' },
  USER: { label: 'Member', icon: User, color: 'text-zinc-600 dark:text-zinc-400' },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'text-zinc-500 dark:text-zinc-500' },
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
        'group w-full rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] text-left p-5 transition-all duration-200 shadow-none',
        'hover:border-[#111111] dark:hover:border-[#f4f4f5]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f4f4f5]',
        'disabled:pointer-events-none disabled:opacity-50',
        'flex items-center gap-4',
      )}
    >
      {/* Workspace avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5] font-bold text-lg select-none border border-[#d3cec6] dark:border-[#27272a]">
        {workspace.workspaceName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] truncate">{workspace.workspaceName}</span>
          <Badge variant={statusVariant[workspace.status] ?? 'secondary'} className="text-[10px] py-0 font-medium">
            {workspace.status}
          </Badge>
        </div>
        <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5">@{workspace.subdomain}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#7b7b78] dark:text-[#71717a]">
          <RoleIcon className={cn('h-3 w-3', role.color)} />
          <span>{role.label}</span>
          {workspace.department && (
            <>
              <span>·</span>
              <span>{workspace.department}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-[#626260] dark:text-[#a1a1aa] shrink-0 group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors" />
    </button>
  );
}

export default function SelectWorkspacePage() {
  const { user, workspaces: ctxWorkspaces, selectWorkspace, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(ctxWorkspaces);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Pending invites
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [acceptingToken, setAcceptingToken] = useState<string | null>(null);

  // Track if we've already attempted auto-select so it doesn't loop
  const autoSelectAttempted = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Hydrate workspaces: use context first, then localStorage, then re-fetch from API
  useEffect(() => {
    if (!user) return;

    const hydrate = async () => {
      let resolved = ctxWorkspaces;

      if (!resolved.length) {
        // Try localStorage
        resolved = tokenStorage.getWorkspaces();
      }

      if (!resolved.length) {
        // Fallback: fetch from server (handles page refresh after select-workspace was skipped)
        try {
          const res = await getMyWorkspaces();
          resolved = res.data ?? [];
          tokenStorage.setWorkspaces(resolved);
        } catch {
          // ignore — user may have no workspaces
        }
      }

      setWorkspaces(resolved);
    };

    void hydrate();
  }, [user, ctxWorkspaces]);

  // Always fetch pending invites for this user
  useEffect(() => {
    if (!user) return;

    getPendingInvites()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setInvites(Array.isArray(list) ? list : []);
      })
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [user]);

  // Auto-select: only if exactly 1 workspace AND no pending invites AND not yet attempted
  useEffect(() => {
    if (
      !authLoading &&
      !loadingInvites &&
      !autoSelectAttempted.current &&
      workspaces.length === 1 &&
      invites.length === 0 &&
      user
    ) {
      autoSelectAttempted.current = true;
      void handleSelect(workspaces[0].workspaceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, loadingInvites, workspaces, invites]);

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
      // After accepting, reload the whole page so workspaces re-fetch cleanly
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
      setAcceptingToken(null);
    }
  };

  if (authLoading || (workspaces.length === 1 && invites.length === 0 && !loadingInvites)) {
    // Show spinner while auto-selecting
    return (
      <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111111] dark:text-[#f4f4f5]" />
      </div>
    );
  }

  const hasWorkspaces = workspaces.length > 0;
  const hasInvites = invites.length > 0;
  const hasNothing = !hasWorkspaces && !hasInvites && !loadingInvites;

  return (
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] flex flex-col justify-between transition-colors duration-300">
      {/* Top spacing */}
      <div className="py-4" />

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-20 pt-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo + header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo variant="mark" width={44} height={44} className="mb-4" />
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">Select workspace</h1>
            <p className="mt-1.5 text-sm text-[#626260] dark:text-[#a1a1aa]">
              Welcome back,{' '}
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{user?.username}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Your Workspaces */}
            {hasWorkspaces && (
              <div className="space-y-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a] mb-2 px-1">
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

            {/* Pending Invites */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a] mb-2 px-1 flex items-center gap-1.5">
                <Bell className="h-3 w-3" />
                Pending Invites
                {hasInvites && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] dark:bg-[#f4f4f5] text-[10px] font-bold text-[#ffffff] dark:text-[#09090b] px-1">
                    {invites.length}
                  </span>
                )}
              </h2>

              {loadingInvites ? (
                <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 flex justify-center shadow-none">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7b7b78] dark:text-[#71717a]" />
                </div>
              ) : hasInvites ? (
                <div className="space-y-2.5">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-4 flex items-center justify-between shadow-none"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] truncate">{invite.workspace?.name}</p>
                        <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5">
                          Invited by {invite.invitedBy?.username || invite.invitedBy?.email}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-[10px] py-0 font-medium">
                          {invite.role}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold transition-all rounded-md"
                        onClick={() => handleAcceptInvite(invite.token)}
                        disabled={acceptingToken === invite.token}
                      >
                        {acceptingToken === invite.token ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff]/50 dark:bg-[#121214]/50 p-4 text-center">
                  <p className="text-xs text-[#7b7b78] dark:text-[#71717a]">No pending invites</p>
                </div>
              )}
            </div>

            {/* No workspace + no invites: show help card */}
            {hasNothing && (
              <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 text-center shadow-none">
                <MailWarning className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                <h3 className="font-semibold text-[#111111] dark:text-[#f4f4f5] mb-2">Action Required</h3>
                <p className="text-sm text-[#626260] dark:text-[#a1a1aa] mb-4 leading-relaxed">
                  You haven&apos;t been added to any workspace yet. Please wait for your IT or HR admin
                  to assign you a role and invite you to your workspace.
                </p>
                <div className="space-y-1.5 text-xs text-[#7b7b78] dark:text-[#71717a] pt-2 border-t border-[#f5f1ec] dark:border-[#27272a]">
                  <p>Need help? Contact support:</p>
                  <p className="font-semibold text-[#111111] dark:text-[#f4f4f5]">support@atlas.amdox.in</p>
                  <p className="font-semibold text-[#111111] dark:text-[#f4f4f5]">hr@atlas.amdox.in</p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-[#7b7b78] dark:text-[#71717a]">
            Signed in as <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{user?.email}</span>
          </p>

          {/* Logout Button */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#7b7b78] dark:text-[#71717a] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => logout()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Empty footer area for visual balance */}
      <div className="py-4" />
    </div>
  );
}
