'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-fade-in">
        {/* Decorative Element */}
        <div className="relative mb-10">
          <div className="relative bg-[#ffffff] dark:bg-[#121214] border border-[#d3cec6] dark:border-[#27272a] rounded-[32px] p-10 shadow-sm">
            <div className="h-20 w-20 rounded-2xl bg-[#f5f1ec] dark:bg-[#09090b] border border-[#d3cec6] dark:border-[#27272a] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileQuestion className="h-10 w-10 text-[#7b7b78] dark:text-[#71717a]" />
            </div>
            <h1 className="text-7xl font-semibold tracking-[-0.05em] text-[#111111] dark:text-[#f4f4f5]">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f4f4f5] mb-3">Page Not Found</h2>
        <p className="text-[#626260] dark:text-[#a1a1aa] max-w-[420px] mb-10 leading-relaxed text-sm font-medium">
          The page you&apos;re looking for might have been moved, deleted, or never existed in this workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button asChild size="lg" className="rounded-xl h-11 px-8 bg-[#111111] hover:bg-[#222222] text-[#ffffff] dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-bold shadow-sm">
            <Link href="/dashboard">
              <Home className="mr-2.5 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <Button size="lg" variant="ghost" className="rounded-xl h-11 px-8 text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] hover:bg-[#e8e4dc] dark:hover:bg-[#18181b] font-bold transition-all" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2.5 h-4 w-4" /> Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-20 pt-10 border-t border-[#d3cec6] dark:border-[#27272a] w-full max-w-2xl opacity-80">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] mb-6">Popular Modules</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'HR', href: '/dashboard/hr' },
              { label: 'Finance', href: '/dashboard/finance' },
              { label: 'CRM', href: '/dashboard/crm' },
              { label: 'Projects', href: '/dashboard/projects' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="p-4 rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] hover:border-[#111111] dark:hover:border-[#f4f4f5] transition-all text-xs font-bold text-[#111111] dark:text-[#f4f4f5] shadow-sm uppercase tracking-wider"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14 flex items-center gap-2 text-[#7b7b78] dark:text-[#71717a] text-[10px] font-medium uppercase tracking-tighter italic">
          <Search className="h-3 w-3" />
          <span>Searching for something specific? Contact your administrator.</span>
        </div>
      </div>
    </AppShell>
  );
}
