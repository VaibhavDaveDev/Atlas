'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Users,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Crown,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { listAllWorkspaces, createPlatformWorkspace, type PlatformWorkspace } from '@/lib/platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// ─── Create Org Sheet ────────────────────────────────────────────────────────

function CreateOrgSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-derive subdomain from name
  const handleNameChange = (val: string) => {
    setName(val);
    setSubdomain(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim()) {
      toast.error('Organisation name and subdomain are required');
      return;
    }
    setLoading(true);
    try {
      const result = await createPlatformWorkspace({
        name: name.trim(),
        subdomain: subdomain.trim(),
        adminEmail: adminEmail.trim() || undefined,
      });
      toast.success(
        result.inviteSent
          ? `✅ Workspace created! Invite sent to ${adminEmail}`
          : `✅ Workspace "${name}" created successfully`,
      );
      setName('');
      setSubdomain('');
      setAdminEmail('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#ffffff] dark:bg-[#121214] border-l border-[#d3cec6] dark:border-[#27272a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f1ec] dark:border-[#1a1a1e]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#4f46e5]/10 border border-[#4f46e5]/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#4f46e5] dark:text-[#818cf8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">
                Create Organisation
              </p>
              <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a]">
                New workspace for a company
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#7b7b78] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-xs font-semibold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">
              Organisation Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="org-name"
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] focus-visible:ring-[#4f46e5]/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-subdomain" className="text-xs font-semibold uppercase tracking-wider text-[#7b7b78] dark:text-[#71717a]">
              Subdomain <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] overflow-hidden focus-within:ring-2 focus-within:ring-[#4f46e5]/30">
              <input
                id="org-subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                placeholder="acme"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-[#111111] dark:text-[#f4f4f5] outline-none placeholder:text-[#7b7b78]"
              />
              <span className="px-3 text-xs text-[#7b7b78] dark:text-[#71717a] border-l border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] py-2 whitespace-nowrap font-mono">
                .atlas.app
              </span>
            </div>
            <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a]">
              Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-[#d3cec6] dark:border-[#27272a] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="h-3.5 w-3.5 text-[#4f46e5] dark:text-[#818cf8]" />
              <p className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5]">
                Invite IT Admin (optional)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs text-[#7b7b78] dark:text-[#71717a]">
                IT Admin Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="itadmin@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="border-[#d3cec6] dark:border-[#27272a] bg-transparent"
              />
            </div>
            <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a] leading-relaxed">
              An invite email will be sent to this address. They will join the workspace as{' '}
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">IT Admin</span> once
              they accept.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#d3cec6] dark:border-[#27272a]"
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold"
            onClick={(e) => {
              // Trigger form submit
              const form = e.currentTarget.closest('.flex-col')?.querySelector('form');
              form?.requestSubmit();
            }}
            disabled={loading || !name.trim() || !subdomain.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await listAllWorkspaces();
      setWorkspaces(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organisations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const totalMembers = workspaces.reduce((sum, w) => sum + (w.memberCount || 0), 0);
  const activeOrgs = workspaces.filter((w) => w.status === 'ACTIVE').length;

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1440px] mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-[#4f46e5]/10 border border-[#4f46e5]/20 flex items-center justify-center">
                <Crown className="h-4 w-4 text-[#4f46e5] dark:text-[#818cf8]" />
              </div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">
                Platform Administration
              </h1>
            </div>
            <p className="text-sm text-[#626260] dark:text-[#a1a1aa] ml-11">
              Manage all organisations on Atlas ERP. Signed in as{' '}
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{user?.email}</span>.
            </p>
          </div>
          <Button
            onClick={() => setSheetOpen(true)}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold shadow-sm h-10 px-5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Organisation
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              label: 'Total Organisations',
              value: loading ? '—' : workspaces.length.toString(),
              icon: Building2,
              color: 'text-[#4f46e5] dark:text-[#818cf8]',
            },
            {
              label: 'Active Organisations',
              value: loading ? '—' : activeOrgs.toString(),
              icon: CheckCircle2,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Total Members',
              value: loading ? '—' : totalMembers.toString(),
              icon: Users,
              color: 'text-blue-600 dark:text-blue-400',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-5 shadow-none"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                    {s.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">
                    {s.value}
                  </p>
                </div>
                <div className="h-11 w-11 flex items-center justify-center rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] shadow-sm">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Org Table */}
        <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
          <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center justify-between bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">
                All Organisations
              </h2>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] font-bold border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#18181b]"
            >
              {workspaces.length} total
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#7b7b78] dark:text-[#71717a]" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center mb-4 shadow-sm">
                <Building2 className="h-8 w-8 text-[#7b7b78] dark:text-[#71717a]" />
              </div>
              <p className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5]">
                No organisations yet
              </p>
              <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-1.5 max-w-xs">
                Create your first organisation to get started.
              </p>
              <Button
                className="mt-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white h-9 px-4 text-xs font-semibold"
                onClick={() => setSheetOpen(true)}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Create Organisation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f1ec] dark:divide-[#1a1a1e]">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#f5f1ec]/50 dark:hover:bg-[#09090b]/50 transition-colors group"
                >
                  {/* Org Avatar */}
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#4f46e5]/20 to-violet-500/20 border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center text-sm font-bold text-[#4f46e5] dark:text-[#818cf8] shadow-sm">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight truncate">
                        {ws.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                          ws.status === 'ACTIVE'
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                            : 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20'
                        }`}
                      >
                        {ws.status}
                      </Badge>
                      {ws.isAuditEnabled && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-wider border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 shrink-0"
                        >
                          Audit On
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a] font-mono">
                        {ws.subdomain}.atlas.app
                      </p>
                      <span className="text-[#d3cec6] dark:text-[#27272a]">·</span>
                      <p className="text-[11px] text-[#7b7b78] dark:text-[#71717a]">
                        Created {formatDistanceToNow(new Date(ws.createdAt))} ago
                      </p>
                    </div>
                  </div>

                  {/* Member count */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#626260] dark:text-[#a1a1aa] shrink-0">
                    <Users className="h-3.5 w-3.5" />
                    {ws.memberCount} member{ws.memberCount !== 1 ? 's' : ''}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-4 w-4 text-[#7b7b78] dark:text-[#71717a] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-[#4f46e5]/20 bg-[#4f46e5]/5 px-5 py-4">
          <AlertCircle className="h-4 w-4 text-[#4f46e5] dark:text-[#818cf8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">
              Platform Owner Access
            </p>
            <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-1 leading-relaxed">
              This panel is only visible to Platform Owners. Each organisation manages its own IT Admin,
              members, and permissions independently. Use{' '}
              <span className="font-semibold">Create Organisation</span> to onboard a new company and
              optionally invite their IT Admin.
            </p>
          </div>
        </div>
      </div>

      <CreateOrgSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={fetchWorkspaces}
      />
    </AppShell>
  );
}
