'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        {/* Decorative Element */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-card border border-border rounded-3xl p-8 shadow-2xl">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-8xl font-black tracking-tighter text-foreground">404</h1>
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight mb-3">Page Not Found</h2>
        <p className="text-muted-foreground max-w-[450px] mb-10 leading-relaxed">
          The page you're looking for might have been moved, deleted, or never existed in this workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button asChild variant="default" size="lg" className="rounded-xl h-12 px-8">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-8">
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </button>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-16 pt-8 border-t border-border w-full max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Popular Pages</p>
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
                className="p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-2 text-muted-foreground/40 text-xs">
          <Search className="h-3 w-3" />
          <span>Searching for something specific? Contact your administrator.</span>
        </div>
      </div>
    </AppShell>
  );
}
