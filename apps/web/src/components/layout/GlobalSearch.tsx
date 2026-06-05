'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
  Calendar,
  Terminal,
  User,
  Award,
  Landmark,
  LifeBuoy,
  FileText,
  LogOut,
  TrendingUp,
  ListTodo,
  Milestone as MilestoneIcon,
  Crown,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SearchResult {
  title: string;
  description?: string;
  href: string;
  icon: React.ElementType;
  category: string;
  roles?: string[];
  platformOnly?: boolean;
}

const SEARCH_DATA: SearchResult[] = [
  // Dashboard & General
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'General' },
  { title: 'My Tasks', href: '/dashboard/my-work', icon: ListTodo, category: 'My Work' },
  { title: 'My Projects', href: '/dashboard/my-work/projects', icon: Briefcase, category: 'My Work' },
  
  // ESS
  { title: 'My Profile', href: '/dashboard/ess/profile', icon: User, category: 'Self Service' },
  { title: 'Attendance', href: '/dashboard/ess/attendance', icon: Clock, category: 'Self Service' },
  { title: 'Leaves', href: '/dashboard/ess/leaves', icon: Calendar, category: 'Self Service' },
  { title: 'Appraisals', href: '/dashboard/ess/appraisals', icon: Award, category: 'Self Service' },
  { title: 'Payslips', href: '/dashboard/ess/payslips', icon: FileText, category: 'Self Service' },
  { title: 'Helpdesk', href: '/dashboard/ess/tickets', icon: LifeBuoy, category: 'Self Service' },

  // HR (Admin Only)
  { title: 'Employee Directory', href: '/dashboard/hr/employees', icon: Users2, category: 'Human Resources', roles: ['ADMIN', 'OWNER'] },
  { title: 'Payroll Processing', href: '/dashboard/hr/payroll', icon: Briefcase, category: 'Human Resources', roles: ['ADMIN', 'OWNER'] },
  { title: 'Company Calendar', href: '/dashboard/hr/events', icon: Calendar, category: 'Human Resources', roles: ['ADMIN', 'OWNER'] },
  { title: 'HR Analytics', href: '/dashboard/hr/performance', icon: BarChart3, category: 'Human Resources', roles: ['ADMIN', 'OWNER'] },
  
  // Finance (Admin Only)
  { title: 'Chart of Accounts', href: '/dashboard/finance/accounts', icon: Landmark, category: 'Finance', roles: ['ADMIN', 'OWNER'] },
  { title: 'Invoices', href: '/dashboard/finance/invoices', icon: BarChart3, category: 'Finance', roles: ['ADMIN', 'OWNER'] },
  { title: 'Journal Entries', href: '/dashboard/finance/journals', icon: FileText, category: 'Finance', roles: ['ADMIN', 'OWNER'] },
  { title: 'Financial Reports', href: '/dashboard/finance/reports/profit-loss', icon: TrendingUp, category: 'Finance', roles: ['ADMIN', 'OWNER'] },

  // IT Admin (Admin Only)
  { title: 'Roles & Permissions', href: '/dashboard/workspace/roles', icon: ShieldCheck, category: 'Administration', roles: ['ADMIN', 'OWNER'] },
  { title: 'Workspace Members', href: '/dashboard/workspace/members', icon: Users, category: 'Administration', roles: ['ADMIN', 'OWNER'] },
  { title: 'System Logs', href: '/dashboard/admin/logs', icon: Terminal, category: 'Administration', roles: ['ADMIN', 'OWNER'] },
  { title: 'Security Settings', href: '/dashboard/admin/security', icon: ShieldCheck, category: 'Administration', roles: ['ADMIN', 'OWNER'] },
  
  // Platform Admin
  { title: 'Platform Admin', href: '/dashboard/platform-admin', icon: Crown, category: 'Platform', platformOnly: true },
];

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const { workspace, user } = useAuth();

  const isAdmin = workspace?.role === 'ADMIN' || workspace?.role === 'OWNER';
  const isPlatformAdmin = user?.role === 'admin';

  const filteredResults = React.useMemo(() => {
    return SEARCH_DATA.filter((item) => {
      // Platform check
      if (item.platformOnly && !isPlatformAdmin) return false;
      
      // Role check
      if (item.roles && !isAdmin) return false;

      // Query search
      if (!query) return false;
      return (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
    }).slice(0, 10);
  }, [query, isAdmin, isPlatformAdmin]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      if (filteredResults[selectedIndex]) {
        onSelect(filteredResults[selectedIndex].href);
      }
    }
  };

  const onSelect = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center h-9 w-9 sm:w-52 lg:w-64 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff]/50 dark:bg-[#121214]/50 p-0 sm:pl-9 sm:pr-2 text-sm text-[#7b7b78] dark:text-[#71717a] hover:bg-[#ffffff] dark:hover:bg-[#121214] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all group justify-center sm:justify-start"
      >
        <Search className="sm:absolute sm:left-3 h-3.5 w-3.5 group-hover:text-[#111111] dark:group-hover:text-[#f4f4f5] transition-colors" />
        <span className="truncate hidden sm:inline-block">Search Atlas…</span>
        <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#09090b] px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-2xl sm:top-[50%] sm:translate-y-[-50%] top-0 translate-y-0 sm:left-[50%] sm:translate-x-[-50%] left-0 translate-x-0 w-full max-w-none rounded-none sm:rounded-xl border-x-0 sm:border-x border-t-0 sm:border-t">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for pages, tools, or settings across Atlas.
          </DialogDescription>
          <div className="flex items-center border-b border-[#f5f1ec] dark:border-[#1a1a1e] px-4">
            <Search className="h-4 w-4 text-[#7b7b78] dark:text-[#71717a] mr-3" />
            <Input
              autoFocus
              placeholder="Search for pages, tools, or settings..."
              className="h-14 border-none bg-transparent focus-visible:ring-0 text-base p-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] hover:text-[#111111] dark:hover:text-[#f4f4f5]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto p-2">
            {query === '' && (
              <div className="py-6 px-4 text-center">
                <p className="text-sm text-[#626260] dark:text-[#a1a1aa]">Type to search for pages and tools in Atlas</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Dashboard', 'My Work', 'HR', 'Finance'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[#d3cec6] dark:border-[#27272a] rounded-full hover:bg-[#f5f1ec] dark:hover:bg-[#1c1c1f]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query !== '' && filteredResults.length === 0 && (
              <div className="py-12 px-4 text-center">
                <Search className="h-8 w-8 text-[#d3cec6] dark:text-[#27272a] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#111111] dark:text-[#f4f4f5]">No results found for &quot;{query}&quot;</p>
                <p className="text-xs text-[#626260] dark:text-[#a1a1aa] mt-1">Try a different keyword or browse the sidebar.</p>
              </div>
            )}

            {filteredResults.length > 0 && (
              <div className="space-y-1">
                {filteredResults.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.href}
                      onClick={() => onSelect(result.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group",
                        index === selectedIndex 
                          ? "bg-[#f5f1ec] dark:bg-[#1c1c1f] shadow-sm" 
                          : "hover:bg-[#f5f1ec]/50 dark:hover:bg-[#1c1c1f]/50"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border transition-colors",
                        index === selectedIndex
                          ? "bg-[#ffffff] dark:bg-[#121214] border-[#d3cec6] dark:border-[#27272a] text-[#111111] dark:text-[#f4f4f5]"
                          : "bg-[#ffffff]/50 dark:bg-[#121214]/50 border-transparent text-[#7b7b78] dark:text-[#71717a]"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-semibold tracking-tight",
                            index === selectedIndex ? "text-[#111111] dark:text-[#f4f4f5]" : "text-[#626260] dark:text-[#a1a1aa]"
                          )}>
                            {result.title}
                          </p>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity">
                            {result.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7b7b78] dark:text-[#71717a] truncate">
                          {result.href}
                        </p>
                      </div>
                      {index === selectedIndex && (
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#7b7b78] dark:text-[#71717a]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[#f5f1ec] dark:border-[#1a1a1e] px-4 py-3 bg-[#f5f1ec]/30 dark:bg-[#09090b]/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] px-1.5 py-0.5 text-[10px] font-bold">↵</kbd>
                <span className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] px-1.5 py-0.5 text-[10px] font-bold">↑↓</kbd>
                <span className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">Navigate</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] px-1.5 py-0.5 text-[10px] font-bold">ESC</kbd>
              <span className="text-[10px] text-[#626260] dark:text-[#a1a1aa] font-medium uppercase tracking-wider">Close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
