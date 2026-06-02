'use client';

import Link from 'next/link';
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
  Calendar,
  Terminal,
  User,
  Award,
  Landmark,
  LifeBuoy,
  FileText,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/common/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const mainModules: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'ESS', href: '/dashboard/ess', icon: User },
  { label: 'HR', href: '/dashboard/hr', icon: Users2 },
  { label: 'CRM', href: '/dashboard/crm', icon: Users, badge: 'Soon' },
  { label: 'Finance', href: '/dashboard/finance', icon: BarChart3, badge: 'Soon' },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban, badge: 'Soon' },
];

const essModules: NavItem[] = [
  { label: 'My Dashboard', href: '/dashboard/ess', icon: LayoutDashboard },
  { label: 'My Profile', href: '/dashboard/ess/profile', icon: User },
  { label: 'My Attendance', href: '/dashboard/ess/attendance', icon: Clock },
  { label: 'My Leaves', href: '/dashboard/ess/leaves', icon: Calendar },
  { label: 'My Calendar', href: '/dashboard/ess/calendar', icon: Calendar },
  { label: 'Appraisals', href: '/dashboard/ess/appraisals', icon: Award },
  { label: 'Tax Declarations', href: '/dashboard/ess/tax', icon: Landmark },
  { label: 'Helpdesk', href: '/dashboard/ess/tickets', icon: LifeBuoy },
  { label: 'My Payslips', href: '/dashboard/ess/payslips', icon: FileText },
];

const hrModules: NavItem[] = [
  { label: 'Overview', href: '/dashboard/hr', icon: LayoutDashboard },
  { label: 'Employees', href: '/dashboard/hr/employees', icon: Users2 },
  { label: 'Attendance', href: '/dashboard/hr/attendance', icon: Clock },
  { label: 'Leaves', href: '/dashboard/hr/leaves', icon: Calendar },
  { label: 'Performance', href: '/dashboard/hr/performance', icon: BarChart3 },
  { label: 'Payroll', href: '/dashboard/hr/payroll', icon: Briefcase },
  { label: 'HR Helpdesk', href: '/dashboard/hr/tickets', icon: LifeBuoy },
  { label: 'Movements', href: '/dashboard/hr/movements', icon: ArrowRightLeft },
  { label: 'Separations', href: '/dashboard/hr/separations', icon: LogOut },
  { label: 'Tax Declarations', href: '/dashboard/hr/compliance/india/declarations', icon: Landmark },
  { label: 'Compliance', href: '/dashboard/hr/compliance/india', icon: ShieldCheck },
];

const adminModules: NavItem[] = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Roles & Permissions', href: '/dashboard/workspace/roles', icon: ShieldCheck },
  { label: 'Members', href: '/dashboard/workspace/members', icon: Users },
  { label: 'IT Helpdesk', href: '/dashboard/admin/tickets', icon: LifeBuoy },
  { label: 'System Logs', href: '/dashboard/admin/logs', icon: Terminal },
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
  const isAdminRoute = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/workspace/roles');
  const isEssRoute = pathname.startsWith('/dashboard/ess');
  
  let displayItems = mainModules;
  let sectionLabel = 'Modules';

  if (isHrRoute) {
    displayItems = hrModules;
    sectionLabel = 'HR Management';
  } else if (isAdminRoute) {
    displayItems = adminModules;
    sectionLabel = 'IT Administration';
  } else if (isEssRoute) {
    displayItems = essModules;
    sectionLabel = 'ESS';
  }
  
  const collapsedOtherModules = (isHrRoute || isAdminRoute || isEssRoute) 
    ? mainModules.filter(m => !pathname.startsWith(m.href)) 
    : [];

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
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-[#f5f1ec] dark:bg-[#09090b] border-r border-[#d3cec6] dark:border-[#27272a] transition-all duration-300 md:relative',
          collapsed ? 'w-[60px]' : 'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo area & Toggle */}
        <div className="flex h-14 items-center justify-between px-4 shrink-0">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 select-none">
              <Logo variant="mark" width={24} height={24} />
              <span className="text-sm font-semibold truncate tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">Atlas ERP</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto select-none">
              <Logo variant="mark" width={24} height={24} />
            </Link>
          )}
          
          {/* Sidebar Toggle (Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-[#7b7b78] dark:text-[#71717a] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <Separator className="bg-[#d3cec6] dark:bg-[#27272a] opacity-50" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {!collapsed && (
            <div className="px-2 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                {sectionLabel}
              </p>
            </div>
          )}
          <ul className="space-y-1">
            {displayItems.map((item) => {
              // Special case: "Overview" points to /dashboard/hr but we only want to highlight it if exactly /dashboard/hr
              const isExactModuleOverview = (item.href === '/dashboard/hr' && pathname === '/dashboard/hr') || 
                                          (item.href === '/dashboard/admin' && pathname === '/dashboard/admin');
              
              const isActive = isExactModuleOverview || 
                              (item.href !== '/dashboard' && item.href !== '/dashboard/hr' && item.href !== '/dashboard/admin' && pathname.startsWith(item.href)) || 
                              (item.href === '/dashboard' && pathname === '/dashboard');
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-lg px-2.5 py-2 text-sm transition-all gap-3',
                      isActive
                        ? 'bg-[#ffffff] dark:bg-[#121214] text-[#111111] dark:text-[#f4f4f5] font-semibold border border-[#d3cec6] dark:border-[#27272a] shadow-sm'
                        : 'text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] border border-transparent',
                      collapsed && 'justify-center',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#111111] dark:text-[#f4f4f5]' : 'text-[#7b7b78] dark:text-[#71717a]')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate tracking-tight">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold text-[#7b7b78] dark:text-[#71717a] border border-[#d3cec6] dark:border-[#27272a] rounded-sm px-1 leading-tight">
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
          {(isHrRoute || isAdminRoute || isEssRoute) && collapsedOtherModules.length > 0 && (
            <div className="mt-8">
              {!collapsed && (
                <div className="px-2 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                    Other Modules
                  </p>
                </div>
              )}
              <ul className="space-y-1">
                {collapsedOtherModules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-lg px-2.5 py-2 text-sm transition-all gap-3 text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] border border-transparent',
                          collapsed && 'justify-center',
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#7b7b78] dark:text-[#71717a]" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate tracking-tight">{item.label}</span>
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
        <div className="px-3 pb-4">
          <Separator className="mb-3 bg-[#d3cec6] dark:bg-[#27272a] opacity-50" />
          <div className="space-y-1">
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
                    'flex items-center rounded-lg px-2.5 py-2 text-sm transition-all gap-3',
                    isActive 
                      ? 'bg-[#ffffff] dark:bg-[#121214] text-[#111111] dark:text-[#f4f4f5] font-semibold border border-[#d3cec6] dark:border-[#27272a] shadow-sm'
                      : 'text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] border border-transparent',
                    collapsed && 'justify-center',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#111111] dark:text-[#f4f4f5]' : 'text-[#7b7b78] dark:text-[#71717a]')} />
                  {!collapsed && <span className="tracking-tight">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* User & Org Switcher block */}
          <Link href="/select-workspace" className="block focus:outline-none mt-2">
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] px-2.5 py-2.5 transition-all hover:border-[#111111] dark:hover:border-[#f4f4f5] shadow-sm',
                collapsed && 'justify-center border-transparent bg-transparent hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] p-1.5 shadow-none',
              )}
              title={collapsed ? `Switch Org: ${workspace?.workspaceName}` : undefined}
            >
              {collapsed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f1ec] dark:bg-[#09090b] text-[#111111] dark:text-[#f4f4f5] text-xs font-bold shrink-0 border border-[#d3cec6] dark:border-[#27272a]">
                  {workspace?.workspaceName?.charAt(0) || 'A'}
                </div>
              ) : (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f1ec] dark:bg-[#09090b] text-[#111111] dark:text-[#f4f4f5] text-xs font-bold border border-[#d3cec6] dark:border-[#27272a]">
                    {workspace?.workspaceName?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight text-[#111111] dark:text-[#f4f4f5] tracking-tight">
                      {workspace?.workspaceName || 'Select Workspace'}
                    </p>
                    <p className="truncate text-[10px] text-[#7b7b78] dark:text-[#a1a1aa] mt-0.5">
                      {user?.username || 'User'}
                    </p>
                  </div>
                  <ArrowRightLeft className="h-3 w-3 text-[#7b7b78] dark:text-[#a1a1aa] shrink-0" />
                </>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}