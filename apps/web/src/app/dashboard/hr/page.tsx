'use client';

import {
  Users,
  Briefcase,
  Building2,
  CalendarCheck,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
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
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm hover:border-primary/30 h-full">
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

  const stats: StatCardProps[] = [
    {
      title: 'Total Employees',
      value: '0',
      subtitle: 'Active headcount',
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      href: '/dashboard/hr/employees',
    },
    {
      title: 'Departments',
      value: '0',
      subtitle: 'Across organization',
      icon: Building2,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
      href: '/dashboard/hr/departments',
    },
    {
      title: 'Open Positions',
      value: '—',
      subtitle: 'Recruitment coming soon',
      icon: Briefcase,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      title: 'On Leave Today',
      value: '0',
      subtitle: 'Attendance & Leaves',
      icon: CalendarCheck,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
  ];

  const quickActions = [
    {
      title: 'Onboard Employee',
      desc: 'Add a new member to the directory',
      icon: UserPlus,
      color: 'bg-blue-500 text-white',
      href: '/dashboard/hr/employees/new',
    },
    {
      title: 'Log Attendance',
      desc: 'Mark today\'s check-in/out',
      icon: CalendarCheck,
      color: 'bg-emerald-500 text-white',
      href: '#',
    },
    {
      title: 'Manage Departments',
      desc: 'Update company structure',
      icon: Building2,
      color: 'bg-violet-500 text-white',
      href: '/dashboard/hr/departments',
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
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </div>

        {/* Lower grid — Quick Actions + Upcoming */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card">
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
                    className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
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

          {/* HR Notices */}
          <div className="rounded-xl border border-border bg-card">
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
