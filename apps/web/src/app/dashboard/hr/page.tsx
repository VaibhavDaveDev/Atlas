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
  iconBg: string;
  href?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  href,
}: StatCardProps) {
  const CardContent = (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <span>{subtitle}</span>
        </div>
      )}
      {href && (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
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
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      href: '/dashboard/hr/employees',
    },
    {
      title: 'Pending Leaves',
      value: kpis.pendingLeaves,
      subtitle: 'Requiring approval',
      icon: CalendarCheck,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      href: '/dashboard/hr/leaves',
    },
    {
      title: 'Active Onboarding',
      value: kpis.activeOnboarding,
      subtitle: 'New hires in process',
      icon: UserPlus,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      href: '/dashboard/hr/onboarding',
    },
    {
      title: 'Last Payroll',
      value: '₹0',
      subtitle: 'Total net processed',
      icon: Briefcase,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
      href: '/dashboard/hr/payroll',
    },
  ];

  const quickActions = [
    {
      title: 'Run Payroll',
      desc: 'Process monthly salaries',
      icon: Briefcase,
      color: 'bg-violet-500 text-white',
      href: '/dashboard/hr/payroll',
    },
    {
      title: 'Onboarding',
      desc: 'Start new hire checklist',
      icon: UserPlus,
      color: 'bg-blue-500 text-white',
      href: '/dashboard/hr/onboarding',
    },
    {
      title: 'Leave Requests',
      desc: 'Approve or reject leaves',
      icon: CalendarCheck,
      color: 'bg-amber-500 text-white',
      href: '/dashboard/hr/leaves',
    },
    {
      title: 'Employee Directory',
      desc: 'View all staff records',
      icon: Users,
      color: 'bg-emerald-500 text-white',
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
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Human Resources
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage employees, attendance, and company structure for {workspace?.workspaceName}.
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Statutory Compliance Status */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/30">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Statutory Status (India)</h2>
                </div>
                <Link href="/dashboard/hr/compliance/india" className="text-xs text-primary hover:underline font-medium">Manage Compliance</Link>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="flex h-24 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : statutoryData ? (
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">PAN Records</span>
                        <span className="text-xs font-bold">{statutoryData?.panRecords?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${statutoryData?.panRecords?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{statutoryData?.panRecords?.filled ?? 0} of {statutoryData?.panRecords?.total ?? 0} employees filled</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">PF Nominations</span>
                        <span className="text-xs font-bold">{statutoryData?.pfNominations?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${statutoryData?.pfNominations?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{statutoryData?.pfNominations?.filled ?? 0} of {statutoryData?.pfNominations?.total ?? 0} employees filled</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">TDS Declarations</span>
                        <span className="text-xs font-bold">{statutoryData?.tdsDeclarations?.pct ?? 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${statutoryData?.tdsDeclarations?.pct ?? 0}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{statutoryData?.tdsDeclarations?.filled ?? 0} of {statutoryData?.tdsDeclarations?.total ?? 0} submitted</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs">No statutory data available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold">Quick Actions</h2>
              </div>
              <div className="p-5 grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/50"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HR Notices */}
          <div className="rounded-xl border border-border bg-card h-fit">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Announcements</h2>
            </div>
            <div className="p-5 flex flex-col items-center justify-center text-center h-[200px]">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">No announcements</p>
              <p className="text-xs text-muted-foreground mt-1">
                Company-wide notices will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
