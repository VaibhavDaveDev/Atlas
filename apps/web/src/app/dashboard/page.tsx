'use client';

import {
  Users,
  BarChart3,
  FolderKanban,
  TrendingUp,
  Activity,
  ArrowUpRight,
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
  positive?: boolean;
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  positive = true,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-5 transition-all shadow-none group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] transition-transform group-hover:scale-105 shadow-sm`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium">
          <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
            <ArrowUpRight
              className={`h-3 w-3 ${positive ? '' : 'rotate-90'}`}
            />
            <span className="font-bold">{change}</span>
          </div>
          <span className="text-[#626260] dark:text-[#a1a1aa]">{changeLabel}</span>
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
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    href: '/dashboard/hr',
    status: 'Active',
    metrics: ['Total Employees: 1', 'Pending Leaves: 0'],
  },
  {
    title: 'IT Administration',
    desc: 'Manage roles, permissions and users',
    icon: ShieldCheck,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50/50 dark:bg-violet-950/20',
    href: '/dashboard/admin',
    status: 'Active',
    metrics: ['Custom Roles: Active', 'RBAC: Enforced'],
    adminOnly: true,
  },
  {
    title: 'Finance & Accounts',
    desc: 'Invoicing, expenses, and ledgers',
    icon: Wallet,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    href: '/dashboard/finance',
    status: 'Setup Required',
    metrics: ['Balance: ₹0', 'Overdue: 0'],
  },
  {
    title: 'CRM & Sales',
    desc: 'Leads, deals, and customer relations',
    icon: TrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50/50 dark:bg-orange-950/20',
    href: '/dashboard/crm',
    status: 'Active',
    metrics: ['Open Deals: 0', 'New Leads: 0'],
  },
  {
    title: 'Project Management',
    desc: 'Tasks, timelines, and collaboration',
    icon: FolderKanban,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
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

  const isAdmin = workspace && ['OWNER', 'ADMIN'].includes(workspace.role);
  const visibleModules = moduleCards.filter(m => !m.adminOnly || isAdmin);

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-8 max-w-[1440px] mx-auto animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5]">
              {greeting}, {user?.username} 👋
            </h1>
            <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#7b7b78] dark:text-[#71717a]" /> 
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{workspace?.workspaceName}</span>
              <span className="h-1 w-1 rounded-full bg-[#d3cec6] dark:bg-[#27272a]" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">System Online</span>
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
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Active Projects"
            value="0"
            change="—"
            changeLabel="Steady progress"
            icon={FolderKanban}
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            title="Employee Count"
            value="1"
            change="+1"
            changeLabel="This month"
            icon={Users}
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            title="Pending Actions"
            value="0"
            icon={Activity}
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Modules Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Active Modules</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {visibleModules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Link
                      key={module.title}
                      href={module.href}
                      className="group p-6 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] transition-all hover:border-[#111111] dark:hover:border-[#f4f4f5] relative overflow-hidden shadow-none"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] shadow-sm`}>
                          <Icon className={`h-5 w-5 ${module.color}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight group-hover:text-[#4f46e5] transition-colors truncate">
                            {module.title}
                          </h3>
                          <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5 line-clamp-1">{module.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {module.metrics.map((m) => (
                          <span key={m} className="px-2 py-1 bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded text-[10px] font-bold text-[#7b7b78] dark:text-[#71717a] leading-none uppercase tracking-tight">
                            {m}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          module.status === 'Active' ? 'text-emerald-600' : 'text-orange-600'
                        }`}>
                          {module.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[#7b7b78] dark:text-[#71717a] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadlines / Events */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center justify-between bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">Upcoming Schedule</h2>
                </div>
                <Link href="/dashboard/hr/leaves" className="text-[11px] font-bold text-[#4f46e5] dark:text-[#818cf8] hover:underline uppercase tracking-wider">View Calendar</Link>
              </div>
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-xl flex items-center justify-center mb-5 shadow-sm">
                  <Calendar className="h-8 w-8 text-[#7b7b78] dark:text-[#71717a]" />
                </div>
                <p className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight">No upcoming events</p>
                <p className="text-xs text-[#626260] dark:text-[#a1a1aa] max-w-[280px] mt-1.5 leading-relaxed">
                  Once you add tasks, deadlines, or interviews, they will appear in your timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Quick Actions / Shortcuts */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none">
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#7b7b78] dark:text-[#71717a] mb-5">Quick Actions</h2>
              <div className="space-y-1.5">
                {[
                  { label: 'Add Employee', icon: Users, href: '/dashboard/hr/employees/new' },
                  { label: 'Run Payroll', icon: Briefcase, href: '/dashboard/hr/payroll' },
                  { label: 'Statutory Compliance', icon: ShieldCheck, href: '/dashboard/hr/compliance/india' },
                  { label: 'Project Settings', icon: Building2, href: '/dashboard/settings' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f] border border-transparent hover:border-[#d3cec6] dark:hover:border-[#27272a] group transition-all"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center group-hover:bg-[#ffffff] dark:group-hover:bg-[#121214] transition-colors shadow-sm">
                      <action.icon className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                    </div>
                    <span className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status / Health */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-6 shadow-none">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#7b7b78] dark:text-[#71717a]">System Health</h2>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </div>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-[#626260] dark:text-[#a1a1aa] font-medium">Database Usage</span>
                    <span className="font-bold text-[#111111] dark:text-[#f4f4f5]">2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-full overflow-hidden p-[1px]">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '2%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-[#626260] dark:text-[#a1a1aa] font-medium">API Latency</span>
                    <span className="font-bold text-[#111111] dark:text-[#f4f4f5]">12ms</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-full overflow-hidden p-[1px]">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[#f5f1ec] dark:border-[#1a1a1e]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    <div className="h-full w-full bg-gradient-to-br from-[#4f46e5] to-violet-500 opacity-80" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#111111] dark:text-[#f4f4f5] uppercase tracking-wider">Atlas AI</p>
                    <p className="text-[10px] text-[#626260] dark:text-[#a1a1aa] leading-snug mt-0.5 italic">
                      "India Specific statutory modules are active."
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
