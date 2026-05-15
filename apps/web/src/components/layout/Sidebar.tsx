'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FolderKanban,
  Briefcase,
  Settings,
  Clock,
  Users2,
  ShieldCheck,
  ArrowRightLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const mainModules: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'HR', href: '/dashboard/hr', icon: Users2 },
  { label: 'CRM', href: '/dashboard/crm', icon: Users, badge: 'Soon' },
  { label: 'Finance', href: '/dashboard/finance', icon: BarChart3, badge: 'Soon' },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban, badge: 'Soon' },
];

const hrModules: NavItem[] = [
  { label: 'Overview', href: '/dashboard/hr', icon: LayoutDashboard },
  { label: 'Employees', href: '/dashboard/hr/employees', icon: Users2 },
  { label: 'Attendance', href: '/dashboard/hr/attendance', icon: Clock },
  { label: 'Leaves', href: '/dashboard/hr/leaves', icon: Calendar },
  { label: 'Payroll', href: '/dashboard/hr/payroll', icon: Briefcase },
  { label: 'Compliance', href: '/dashboard/hr/compliance/india', icon: ShieldCheck },
];

const bottomItems: NavItem[] = [
  { label: 'Workspace Settings', href: '/dashboard/workspace/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, workspace } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen?.(false);
  }, [pathname, setMobileOpen]);

  const isHrRoute = pathname.startsWith('/dashboard/hr');
  
  const displayItems = isHrRoute ? hrModules : mainModules;
  const collapsedOtherModules = isHrRoute ? mainModules.filter(m => m.href !== '/dashboard/hr') : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-background border-r border-border transition-all duration-300 md:relative',
          collapsed ? 'w-[60px]' : 'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo area & Toggle */}
        <div className="flex h-14 items-center justify-between px-3 shrink-0">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
              <Image
                src="/images/logo-mark-light-nobg.PNG"
                alt="Atlas"
                width={24}
                height={24}
                className="shrink-0 block dark:hidden"
              />
              <Image
                src="/images/logo-mark-dark-nobg.PNG"
                alt="Atlas"
                width={24}
                height={24}
                className="shrink-0 hidden dark:block"
              />
              <span className="text-sm font-bold truncate tracking-tight">Atlas ERP</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Image
                src="/images/logo-mark-light-nobg.PNG"
                alt="Atlas"
                width={24}
                height={24}
                className="block dark:hidden"
              />
              <Image
                src="/images/logo-mark-dark-nobg.PNG"
                alt="Atlas"
                width={24}
                height={24}
                className="hidden dark:block"
              />
            </Link>
          )}
          
          {/* Sidebar Toggle (Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <Separator className="bg-border" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {!collapsed && (
            <div className="px-2 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isHrRoute ? 'HR Management' : 'Modules'}
              </p>
            </div>
          )}
          <ul className="space-y-0.5">
            {displayItems.map((item) => {
              // Special case: "Overview" points to /dashboard/hr but we only want to highlight it if exactly /dashboard/hr
              const isExactHrOverview = item.href === '/dashboard/hr' && pathname === '/dashboard/hr';
              const isActive = isExactHrOverview || (item.href !== '/dashboard' && item.href !== '/dashboard/hr' && pathname.startsWith(item.href)) || (item.href === '/dashboard' && pathname === '/dashboard');
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-md px-2 py-2 text-sm transition-colors gap-3',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-medium text-muted-foreground/60 border border-border rounded px-1">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Other Modules Collapsed list if in a specific module context */}
          {isHrRoute && collapsedOtherModules.length > 0 && (
            <div className="mt-6">
              {!collapsed && (
                <div className="px-2 pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Other Modules
                  </p>
                </div>
              )}
              <ul className="space-y-0.5">
                {collapsedOtherModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-md px-2 py-2 text-sm transition-colors gap-3',
                          'text-muted-foreground hover:bg-muted hover:text-foreground',
                          collapsed && 'justify-center',
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Bottom items */}
        <div className="px-2 pb-3">
          <Separator className="mb-2 bg-border" />
          {bottomItems.map((item) => {
            // Role based access checking
            if (item.label === 'Workspace Settings' && workspace && ['USER', 'VIEWER'].includes(workspace.role)) {
              return null;
            }
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-2 py-2 text-sm transition-colors gap-3 mb-2',
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* User & Org Switcher block */}
          <Link href="/select-workspace" className="block focus:outline-none">
            <div
              className={cn(
                'mt-1 flex items-center gap-3 rounded-lg border border-border bg-card px-2 py-2 transition-colors hover:bg-muted',
                collapsed && 'justify-center border-transparent bg-transparent hover:bg-muted p-1',
              )}
              title={collapsed ? `Switch Org: ${workspace?.workspaceName}` : undefined}
            >
              {collapsed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {workspace?.workspaceName?.charAt(0) || 'A'}
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {workspace?.workspaceName?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight text-foreground">
                      {workspace?.workspaceName || 'Select Workspace'}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {user?.username || 'User'}
                    </p>
                  </div>
                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}