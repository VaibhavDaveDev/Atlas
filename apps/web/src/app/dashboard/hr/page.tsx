'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  CalendarCheck,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getStatutoryStatus, getEmployees, getLeaveApplications } from '@/lib/hr';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof Users;
  iconColor: string;
  href?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  href,
}: StatCardProps) {
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

export default function HrOverviewPage() {
  const { workspace } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statutoryData, setStatutoryData] = useState<any>(null);
  const [kpis, setKpis] = useState({
    employees: '0',
    pendingLeaves: '0',
    activeOnboarding: '0'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statRes, empRes, leaveRes] = await Promise.all([
        getStatutoryStatus(),
        getEmployees(),
        getLeaveApplications()
      ]);

      if (statRes.success) setStatutoryData(statRes.data);
      
      setKpis({
        employees: empRes.success ? empRes.data.length.toString() : '0',
        pendingLeaves: leaveRes.success ? leaveRes.data.filter((l: any) => l.status === 'PENDING').length.toString() : '0',
        activeOnboarding: empRes.success ? empRes.data.filter((e: any) => e.status === 'ONBOARDING').length.toString() : '0'
      });
    } catch (e) {
      console.error('Failed to fetch HR dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const stats: StatCardProps[] = [
    {
      title: 'Total Employees',
      value: kpis.employees,
      subtitle: 'Active headcount',
      icon: Users,
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/dashboard/hr/employees',
    },
    {
      title: 'Pending Leaves',
      value: kpis.pendingLeaves,
      subtitle: 'Requiring approval',
      icon: CalendarCheck,
      iconColor: 'text-orange-600 dark:text-orange-400',
      href: '/dashboard/hr/leaves',
    },
    {
      title: 'Active Onboarding',
      value: kpis.activeOnboarding,
      subtitle: 'New hires in process',
      icon: UserPlus,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/dashboard/hr/onboarding',
    },
    {
      title: 'Last Payroll',
      value: '₹0',
      subtitle: 'Total net processed',
      icon: Briefcase,
      iconColor: 'text-violet-600 dark:text-violet-400',
      href: '/dashboard/hr/payroll',
    },
  ];

  const quickActions = [
    {
      title: 'Run Payroll',
      desc: 'Process monthly salaries',
      icon: Briefcase,
      color: 'bg-violet-600 text-white',
      href: '/dashboard/hr/payroll',
    },
    {
      title: 'Performance',
      desc: 'Appraisals & Goals',
      icon: Users,
      color: 'bg-indigo-600 text-white',
      href: '/dashboard/hr/performance',
    },
    {
      title: 'Helpdesk',
      desc: 'HR & IT Tickets',
      icon: AlertCircle,
      color: 'bg-red-600 text-white',
      href: '/dashboard/hr/tickets',
    },
    {
      title: 'Onboarding',
      desc: 'Start new hire checklist',
      icon: UserPlus,
      color: 'bg-blue-600 text-white',
      href: '/dashboard/hr/onboarding',
    },
    {
      title: 'Leave Requests',
      desc: 'Approve or reject leaves',
      icon: CalendarCheck,
      color: 'bg-orange-600 text-white',
      href: '/dashboard/hr/leaves',
    },
    {
      title: 'Employee Directory',
      desc: 'View all staff records',
      icon: Users,
      color: 'bg-emerald-600 text-white',
      href: '/dashboard/hr/employees',
    },
    {
      title: 'Statutory Compliance',
      desc: 'PF, ESI, and Tax (India)',
      icon: ShieldCheck,
      color: 'bg-orange-500 text-white',
      href: '/dashboard/hr/compliance/india',
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
                <Briefcase className="h-4.5 w-4.5 text-[#4f46e5] dark:text-[#818cf8]" />
              </div>
              Human Resources
            </h1>
            <p className="mt-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
              Manage employees, attendance, and company structure for <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">{workspace?.workspaceName}</span>.
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
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statutory Compliance Status */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="flex items-center justify-between border-b border-[#f5f1ec] dark:border-[#1a1a1e] px-6 py-4 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#111111] dark:text-[#f4f4f5]" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">Statutory Status (India)</h2>
                </div>
                <Link href="/dashboard/hr/compliance/india" className="text-[11px] font-bold text-[#4f46e5] dark:text-[#818cf8] hover:underline uppercase tracking-wider">Manage Compliance</Link>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#7b7b78] dark:text-[#71717a]" /></div>
                ) : statutoryData ? (
                  <div className="grid gap-8 sm:grid-cols-3">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-tight text-[#7b7b78] dark:text-[#71717a]">PAN Records</span>
                        <span className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5]">{statutoryData?.panRecords?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-full overflow-hidden p-[1px]">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${statutoryData?.panRecords?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium italic">{statutoryData?.panRecords?.filled ?? 0} of {statutoryData?.panRecords?.total ?? 0} employees filled</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-tight text-[#7b7b78] dark:text-[#71717a]">PF Nominations</span>
                        <span className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5]">{statutoryData?.pfNominations?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-full overflow-hidden p-[1px]">
                        <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${statutoryData?.pfNominations?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium italic">{statutoryData?.pfNominations?.filled ?? 0} of {statutoryData?.pfNominations?.total ?? 0} employees filled</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-tight text-[#7b7b78] dark:text-[#71717a]">TDS Declarations</span>
                        <span className="text-sm font-bold text-[#111111] dark:text-[#f4f4f5]">{statutoryData?.tdsDeclarations?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] rounded-full overflow-hidden p-[1px]">
                        <div className="h-full bg-orange-600 rounded-full transition-all duration-500" style={{ width: `${statutoryData?.tdsDeclarations?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium italic">{statutoryData?.tdsDeclarations?.filled ?? 0} of {statutoryData?.tdsDeclarations?.total ?? 0} submitted</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center mb-4">
                      <AlertCircle className="h-6 w-6 text-[#7b7b78] dark:text-[#71717a] opacity-40" />
                    </div>
                    <p className="text-xs font-semibold text-[#7b7b78] dark:text-[#71717a]">No statutory data available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] overflow-hidden shadow-none">
              <div className="flex items-center gap-2.5 border-b border-[#f5f1ec] dark:border-[#1a1a1e] px-6 py-4 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">HR Operations</h2>
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
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight group-hover:text-[#4f46e5] transition-colors truncate">{action.title}</h3>
                        <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-0.5 line-clamp-1">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HR Notices */}
          <div className="rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] h-fit shadow-none overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-[#f5f1ec] dark:border-[#1a1a1e] px-6 py-4 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#111111] dark:text-[#f4f4f5]">Announcements</h2>
            </div>
            <div className="p-10 flex flex-col items-center justify-center text-center h-[280px]">
              <div className="h-16 w-16 rounded-xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center mb-5 shadow-sm">
                <CalendarCheck className="h-8 w-8 text-[#7b7b78] dark:text-[#71717a]" />
              </div>
              <p className="font-semibold text-sm text-[#111111] dark:text-[#f4f4f5] tracking-tight">No announcements</p>
              <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-2 max-w-[200px] leading-relaxed italic">
                Company-wide notices and updates will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
