'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Settings,
  ShieldCheck,
  Activity,
  ArrowRight,
  Loader2,
  Lock,
  Key,
  Server,
  LifeBuoy
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { roleApi } from '@/lib/roles';
import { getHelpdeskTickets } from '@/lib/hr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Shield;
  iconColor: string;
  href?: string;
}

function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  href,
}: AdminStatCardProps) {
  const CardContent = (
    <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-5 transition-all shadow-none group h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] transition-transform group-hover:scale-105 shadow-sm`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#626260] dark:text-[#a1a1aa]">
          <span>{subtitle}</span>
        </div>
      )}
      {href && (
        <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#4f46e5] dark:text-[#818cf8] uppercase tracking-wider">
          View details <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }
  return CardContent;
}

export default function AdminOverviewPage() {
  const { workspace, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roleCount, setRoleCount] = useState('0');
  const [ticketCount, setTicketCount] = useState('0');

  useEffect(() => {
    fetchData();
  }, [workspace]);

  const fetchData = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [roles, tickets] = await Promise.all([
        roleApi.getRoles(workspace.workspaceId),
        getHelpdeskTickets(undefined, 'IT')
      ]);
      setRoleCount(roles.length.toString());
      
      const ticketData = tickets.data || tickets;
      setTicketCount(Array.isArray(ticketData) ? ticketData.length.toString() : '0');
    } catch (e) {
      console.error('Failed to fetch admin dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const stats: AdminStatCardProps[] = [
    {
      title: 'Configured Roles',
      value: roleCount,
      subtitle: 'Custom & System roles',
      icon: Shield,
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: '/dashboard/workspace/roles',
    },
    {
      title: 'Active Members',
      value: '3',
      subtitle: 'Across all roles',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/dashboard/workspace/settings',
    },
    {
      title: 'IT Helpdesk',
      value: ticketCount,
      subtitle: 'Open IT tickets',
      icon: LifeBuoy,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      href: '/dashboard/admin/tickets',
    },
    {
      title: 'System Health',
      value: 'Optimal',
      subtitle: 'All services online',
      icon: Server,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Roles',
      desc: 'Create and configure RBAC roles',
      icon: ShieldCheck,
      color: 'bg-violet-600 text-white',
      href: '/dashboard/workspace/roles',
    },
    {
      title: 'IT Helpdesk',
      desc: 'Technical support requests',
      icon: LifeBuoy,
      color: 'bg-indigo-600 text-white',
      href: '/dashboard/admin/tickets',
    },
    {
      title: 'Invite Members',
      desc: 'Add new users to workspace',
      icon: Users,
      color: 'bg-blue-600 text-white',
      href: '/dashboard/workspace/settings',
    },
    {
      title: 'Workspace Settings',
      desc: 'Branding, domain and regional settings',
      icon: Settings,
      color: 'bg-[#111111] text-white',
      href: '/dashboard/workspace/settings',
    },
    {
      title: 'Audit Logs',
      desc: 'View system-wide activity',
      icon: Activity,
      color: 'bg-orange-600 text-white',
      href: '/dashboard/admin/logs',
    },
  ];

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1440px] mx-auto animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5] flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center shadow-sm">
                <Shield className="h-4.5 w-4.5 text-[#4f46e5] dark:text-[#818cf8]" />
              </div>
              IT Administration
            </h1>
            <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
              Configure access control, manage users, and monitor system health for <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{workspace?.workspaceName}</span>.
            </p>
          </div>
          {loading && (
            <div className="bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7b7b78] dark:text-[#71717a]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">Syncing...</span>
            </div>
          )}
        </div>

        {/* KPI Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <AdminStatCard key={s.title} {...s} />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="flex items-center gap-2.5 border-b border-[#f5f1ec] dark:border-[#1a1a1e] px-6 py-4 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">Administrative Actions</h2>
              </div>
              <div className="p-6 grid gap-5 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-start gap-4 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-4 transition-all hover:border-[#111111] dark:hover:border-[#f4f4f5]"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color} shadow-sm transition-transform group-hover:scale-105`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight group-hover:text-[#4f46e5] transition-colors truncate">{action.title}</h3>
                          <ArrowRight className="h-3.5 w-3.5 text-[#7b7b78] dark:text-[#71717a] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5 line-clamp-1">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Role Assignment Overview Placeholder */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center justify-between bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">Security Overview</h2>
                </div>
              </div>
              <div className="p-16 flex flex-col items-center justify-center text-center opacity-80">
                <div className="h-16 w-16 bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-xl flex items-center justify-center mb-5 shadow-sm">
                  <ShieldCheck className="h-8 w-8 text-[#7b7b78] dark:text-[#71717a]" />
                </div>
                <p className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight">RBAC Fully Enforced</p>
                <p className="text-xs text-[#626260] dark:text-[#a1a1aa] max-w-[320px] mt-1.5 leading-relaxed italic">
                  Access control is active. All users are assigned to roles with granular permissions.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* System Info */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#7b7b78] dark:text-[#71717a] mb-5">System Information</h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#626260] dark:text-[#a1a1aa]">Global Role</span>
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#18181b]">{user?.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#626260] dark:text-[#a1a1aa]">Workspace Role</span>
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tight border-[#d3cec6] dark:border-[#27272a] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">{workspace?.role}</Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
                  <span className="text-xs font-medium text-[#626260] dark:text-[#a1a1aa]">API Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                    Operational
                  </span>
                </div>
              </div>
            </div>

            {/* Help/Docs */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[#4f46e5]/5 group-hover:bg-[#4f46e5]/10 transition-colors" />
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight mb-2">Need Help?</h2>
              <p className="text-xs text-[#626260] dark:text-[#a1a1aa] leading-relaxed mb-5 italic">
                Learn how to configure granular permissions and manage user overrides in our developer documentation.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[11px] font-bold uppercase tracking-widest border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5] hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]" 
                asChild
              >
                <Link href="#">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
