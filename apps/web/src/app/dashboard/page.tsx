'use client';

import {
  Users,
  BarChart3,
  FolderKanban,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: typeof Users;
  iconColor: string;
  iconBg: string;
  positive?: boolean;
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  iconBg,
  positive = true,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <ArrowUpRight
            className={`h-3.5 w-3.5 ${positive ? 'text-emerald-500' : 'text-destructive rotate-90'}`}
          />
          <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
            {change}
          </span>
          <span className="text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

const stats: StatCardProps[] = [
  {
    title: 'Total Revenue',
    value: '₹0',
    change: '—',
    changeLabel: 'No data yet',
    icon: BarChart3,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  {
    title: 'Active Users',
    value: '—',
    change: '—',
    changeLabel: 'No data yet',
    icon: Users,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
  },
  {
    title: 'Open Projects',
    value: '—',
    change: '—',
    changeLabel: 'No data yet',
    icon: FolderKanban,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    title: 'Growth',
    value: '—',
    change: '—',
    changeLabel: 'No data yet',
    icon: TrendingUp,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
];

const activityFeed = [
  {
    id: 1,
    icon: CheckCircle2,
    color: 'text-emerald-500',
    text: 'Authentication module configured',
    time: 'Just now',
  },
  {
    id: 2,
    icon: Building2,
    color: 'text-primary',
    text: 'Workspace created and active',
    time: 'Today',
  },
  {
    id: 3,
    icon: Activity,
    color: 'text-amber-500',
    text: 'CRM, HR, Finance modules — coming soon',
    time: 'Roadmap',
  },
];

export default function DashboardPage() {
  const { user, workspace } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {greeting}, {user?.username} 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {workspace?.workspaceName} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* Lower grid — activity + quick info */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recent Activity</h2>
              </div>
              <span className="text-xs text-muted-foreground">Latest updates</span>
            </div>
            <ul className="divide-y divide-border">
              {activityFeed.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.text}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Full activity log available once modules are active
              </p>
            </div>
          </div>

          {/* Workspace info card */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Workspace</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Name
                </p>
                <p className="text-sm font-medium">{workspace?.workspaceName}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Subdomain
                </p>
                <p className="text-sm text-muted-foreground font-mono">@{workspace?.subdomain}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Your Role
                </p>
                <p className="text-sm font-medium">{workspace?.role}</p>
              </div>
              {workspace?.department && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                    Department
                  </p>
                  <p className="text-sm">{workspace.department}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Status
                </p>
                <div className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {workspace?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
