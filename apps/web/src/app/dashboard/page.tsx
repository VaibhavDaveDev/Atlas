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
  Calendar,
  Wallet,
  ShieldCheck,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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
    <div className="rounded-xl border border-border bg-card p-5 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
            <ArrowUpRight
              className={`h-3 w-3 ${positive ? '' : 'rotate-90'}`}
            />
            <span className="font-semibold">{change}</span>
          </div>
          <span className="text-muted-foreground font-medium">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

const moduleCards = [
  {
    title: 'Human Resources',
    desc: 'Manage people, payroll, and compliance',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    href: '/dashboard/hr',
    status: 'Active',
    metrics: ['Total Employees: 1', 'Pending Leaves: 0'],
  },
  {
    title: 'Finance & Accounts',
    desc: 'Invoicing, expenses, and ledgers',
    icon: Wallet,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    href: '/dashboard/finance',
    status: 'Setup Required',
    metrics: ['Balance: ₹0', 'Overdue: 0'],
  },
  {
    title: 'CRM & Sales',
    desc: 'Leads, deals, and customer relations',
    icon: TrendingUp,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    href: '/dashboard/crm',
    status: 'Active',
    metrics: ['Open Deals: 0', 'New Leads: 0'],
  },
  {
    title: 'Project Management',
    desc: 'Tasks, timelines, and collaboration',
    icon: FolderKanban,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    href: '/dashboard/projects',
    status: 'Active',
    metrics: ['Ongoing Tasks: 0', 'Due Today: 0'],
  },
];

export default function DashboardPage() {
  const { user, workspace } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {user?.username} 👋
            </h1>
            <p className="mt-1 text-base text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {workspace?.workspaceName} 
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-primary">System Online</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="₹1,24,500"
            change="+12.5%"
            changeLabel="vs last month"
            icon={BarChart3}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
          />
          <StatCard
            title="Active Projects"
            value="0"
            change="—"
            changeLabel="Steady progress"
            icon={FolderKanban}
            iconColor="text-amber-500"
            iconBg="bg-amber-500/10"
          />
          <StatCard
            title="Employee Count"
            value="1"
            change="+1"
            changeLabel="This month"
            icon={Users}
            iconColor="text-violet-500"
            iconBg="bg-violet-500/10"
          />
          <StatCard
            title="Pending Actions"
            value="0"
            icon={Activity}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Modules Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight">Active Modules</h2>
                <Link href="/settings" className="text-sm font-medium text-primary hover:underline">
                  Manage Apps
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {moduleCards.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.title}
                      href={module.href}
                      className="group p-5 rounded-2xl border border-border bg-card transition-all hover:border-primary/20 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full opacity-5 ${module.bg}`} />
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${module.bg}`}>
                          <Icon className={`h-6 w-6 ${module.color}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{module.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {module.metrics.map((m) => (
                          <span key={m} className="px-2 py-1 bg-muted rounded-md text-[10px] font-medium text-muted-foreground">
                            {m}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          module.status === 'Active' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {module.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadlines / Events */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Upcoming Schedule</h2>
                </div>
                <button className="text-xs font-semibold text-primary">View Calendar</button>
              </div>
              <div className="p-12 flex flex-col items-center justify-center text-center opacity-60">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground max-w-[280px] mt-1">
                  Once you add tasks, deadlines, or interviews, they will appear in your timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Quick Actions / Shortcuts */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-bold tracking-tight uppercase tracking-wider mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { label: 'Add Employee', icon: Users, href: '/dashboard/hr/employees/new' },
                  { label: 'Run Payroll', icon: Briefcase, href: '/dashboard/hr/payroll' },
                  { label: 'Statutory Compliance', icon: ShieldCheck, href: '/dashboard/hr/compliance/india' },
                  { label: 'Project Settings', icon: Building2, href: '/dashboard/settings' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status / Health */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold tracking-tight uppercase tracking-wider">System Health</h2>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Database Usage</span>
                    <span className="font-medium text-foreground">2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[2%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">API Latency</span>
                    <span className="font-medium text-foreground">12ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[15%]" />
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {/* Placeholder for user avatar or system bot */}
                    <div className="h-full w-full bg-gradient-to-br from-primary to-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Atlas AI Assistant</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      "I've configured the India Specific statutory modules for you."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
