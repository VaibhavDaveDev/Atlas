'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FolderKanban,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'CRM', href: '/dashboard/crm', icon: Users, badge: 'Soon' },
  { label: 'HR', href: '/dashboard/hr', icon: Briefcase, badge: 'Soon' },
  { label: 'Finance', href: '/dashboard/finance', icon: BarChart3, badge: 'Soon' },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban, badge: 'Soon' },
];

const bottomItems: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, workspace } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-250',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo area */}
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
            <span className="text-sm font-bold truncate">Atlas ERP</span>
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
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-11 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Workspace badge */}
      {workspace && (
        <div className={cn('px-3 pb-2', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
              {workspace.workspaceName.charAt(0)}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-2.5 py-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                {workspace.workspaceName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{workspace.workspaceName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{workspace.role}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {!collapsed && (
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Modules
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-md px-2 py-2 text-sm transition-colors gap-3',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70',
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
      </nav>

      {/* Bottom items */}
      <div className="px-2 pb-2">
        <Separator className="mb-2 bg-sidebar-border" />
        {bottomItems.map((item) => {
          // Hide Settings for regular users and viewers
          if (item.label === 'Settings' && workspace && ['USER', 'VIEWER'].includes(workspace.role)) {
            return null;
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-2 py-2 text-sm text-sidebar-foreground/70 transition-colors gap-3',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User avatar */}
        <div
          className={cn(
            'mt-1 flex items-center gap-2 rounded-md px-2 py-2',
            collapsed && 'justify-center',
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.username}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
