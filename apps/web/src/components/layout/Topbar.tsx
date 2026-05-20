'use client';

import Link from 'next/link';
import { Bell, Search, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export function Topbar({ setMobileOpen }: { setMobileOpen?: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { user, workspace, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#d3cec6] dark:border-[#27272a] px-4 sm:px-6 bg-[#f5f1ec]/80 dark:bg-[#09090b]/80 backdrop-blur-md shrink-0 sticky top-0 z-30">
      {/* Left — breadcrumb / search stub */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2 text-[#626260] dark:text-[#a1a1aa]"
          onClick={() => setMobileOpen?.(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[#7b7b78] dark:text-[#71717a] pointer-events-none" />
          <input
            type="search"
            placeholder="Search…"
            className="h-8 w-52 rounded-lg border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff]/50 dark:bg-[#121214]/50 pl-9 pr-3 text-sm outline-none focus:bg-[#ffffff] dark:focus:bg-[#121214] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#f4f4f5] transition-all placeholder:text-[#7b7b78] dark:placeholder:text-[#71717a] text-[#111111] dark:text-[#f4f4f5]"
            aria-label="Global search"
          />
          <kbd className="absolute right-2.5 text-[10px] font-medium text-[#7b7b78] dark:text-[#71717a] hidden lg:block border border-[#d3cec6] dark:border-[#27272a] rounded px-1.5 bg-[#f5f1ec] dark:bg-[#09090b]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right — notifications + user menu */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b]" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {/* Unread dot */}
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] rounded-lg"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7 border border-[#d3cec6] dark:border-[#27272a]">
                <AvatarFallback className="text-[10px] font-bold bg-[#f5f1ec] dark:bg-[#18181b] text-[#111111] dark:text-[#f4f4f5]">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start leading-none gap-0.5">
                <span className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">{user?.username}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#7b7b78] dark:text-[#71717a] hidden md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] shadow-lg animate-in fade-in zoom-in-95 duration-100">
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-[#111111] dark:text-[#f4f4f5] tracking-tight">{user?.username}</p>
                <p className="text-xs leading-none text-[#626260] dark:text-[#a1a1aa]">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#f5f1ec] dark:bg-[#27272a]" />
            {workspace && (
              <>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] mb-1.5">
                    Workspace
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight truncate max-w-[120px]">{workspace.workspaceName}</span>
                    <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 font-bold border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec] dark:bg-[#18181b]">
                      {workspace.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-[#f5f1ec] dark:bg-[#27272a]" />
              </>
            )}
            <div className="p-1">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex w-full items-center cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-[#111111] dark:text-[#f4f4f5] focus:bg-[#f5f1ec] dark:focus:bg-[#1c1c1f]">
                  <User className="mr-2.5 h-3.5 w-3.5 text-[#7b7b78] dark:text-[#71717a]" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer"
                onClick={logout}
              >
                <LogOut className="mr-2.5 h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
