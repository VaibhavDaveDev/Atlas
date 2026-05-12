import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  Users,
  FolderKanban,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export const metadata: Metadata = {
  title: 'Atlas ERP — Enterprise Cloud Suite',
  description: 'AI-powered Cloud ERP Suite. Unify CRM, HR, Finance and Projects in one platform.',
};

const features = [
  {
    icon: BarChart3,
    title: 'Finance & Analytics',
    description:
      'Real-time financial dashboards, automated reporting, and AI-driven forecasting across all your business units.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
  },
  {
    icon: Users,
    title: 'CRM & HR',
    description:
      'End-to-end customer lifecycle management and HR workflows — onboarding, payroll, and performance in one place.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
  },
  {
    icon: FolderKanban,
    title: 'Projects & Ops',
    description:
      'Kanban boards, resource allocation, and cross-department task tracking built for complex enterprise teams.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  },
];

const highlights = [
  'Multi-workspace support',
  'Role-based access control',
  'Real-time collaboration',
  'Enterprise-grade security',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navigation ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <Image
              src="/images/logo-mark-light-nobg.PNG"
              alt="Atlas"
              width={28}
              height={28}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/images/logo-mark-dark-nobg.PNG"
              alt="Atlas"
              width={28}
              height={28}
              className="hidden dark:block"
              priority
            />
            <span className="text-lg font-bold tracking-tight">Atlas ERP</span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Subtle gradient orbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl dark:bg-primary/12" />
            <div className="absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/6 blur-3xl dark:bg-violet-500/10" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 text-center">
            {/* Tag pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary dark:border-primary/30">
              <Zap className="h-3 w-3" />
              AI-Powered Enterprise Platform
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Run your enterprise{' '}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                smarter
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Atlas brings CRM, HR, Finance, and Project Management into one beautifully unified
              cloud platform — built for the way modern enterprises actually work.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button size="xl" asChild>
                <Link href="/register">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/login">Sign in to your workspace</Link>
              </Button>
            </div>

            {/* Trust highlights */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {highlights.map((h) => (
                <span key={h} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section className="border-t border-border/60 bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/* Section header */}
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Platform
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your team needs
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
                A complete suite of enterprise modules, designed to work together seamlessly from
                day one.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5"
                >
                  <div className={`mb-4 inline-flex rounded-lg p-2.5 ${f.bg}`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────── */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 p-12">
              <Globe className="mx-auto mb-4 h-10 w-10 text-primary/60" />
              <h2 className="text-3xl font-bold tracking-tight">
                Ready to modernise your operations?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Join forward-thinking enterprises already running on Atlas.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="xl" asChild>
                  <Link href="/register">
                    Create your workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Amdox. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
