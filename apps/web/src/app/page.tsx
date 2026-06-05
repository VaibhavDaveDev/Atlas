import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  FolderKanban,
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Logo } from '@/components/common/Logo';

export const metadata: Metadata = {
  title: 'Atlas ERP — Enterprise Cloud Suite',
  description: 'AI-powered Cloud ERP Suite. Unify HR, Finance and Projects in one platform.',
};

const features = [
  {
    num: '01',
    icon: BarChart3,
    title: 'Finance & Analytics',
    description:
      'Real-time financial dashboards, automated reporting, and AI-driven forecasting across all your business units.',
    iconClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-400/50 dark:hover:border-blue-500/30',
  },
  {
    num: '02',
    icon: Users,
    title: 'HR & People',
    description:
      'End-to-end HR workflows — onboarding, attendance, payroll, and performance in one unified place.',
    iconClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-400',
    hoverBorder: 'hover:border-purple-400/50 dark:hover:border-purple-500/30',
  },
  {
    num: '03',
    icon: FolderKanban,
    title: 'Projects & Operations',
    description:
      'Kanban boards, resource allocation, and cross-department task tracking built for complex enterprise teams.',
    iconClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-400/50 dark:hover:border-emerald-500/30',
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
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] text-[#111111] dark:text-[#f4f4f5] flex flex-col transition-colors duration-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/90 dark:bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <Logo variant="mark" width={32} height={32} />
            <span className="text-lg font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">Atlas ERP</span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="text-sm font-semibold text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5] transition-colors"
            >
              Sign In
            </Link>
            <Button 
              size="sm" 
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-[#ffffff] dark:bg-[#6366f1] dark:hover:bg-[#4f46e5] font-semibold transition-all rounded-md shadow-sm"
              asChild
            >
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 border-b border-[#d3cec6] dark:border-[#27272a] overflow-hidden">
          {/* Ambient colorful glows behind hero content */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-orange-400/10 dark:bg-orange-500/5 blur-[80px] pointer-events-none" />

          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8e4dc_1px,transparent_1px),linear-gradient(to_bottom,#e8e4dc_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f22_1px,transparent_1px),linear-gradient(to_bottom,#1f1f22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
            {/* Tag pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 shadow-none">
              <Sparkles className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
              AI-Powered Enterprise Suite
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-5xl text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.05] text-[#111111] dark:text-[#f4f4f5]">
              Run your enterprise <br className="hidden md:inline" />
              <span className="font-serif italic font-normal text-orange-600 dark:text-orange-500">smarter</span> & <span className="font-serif italic font-normal text-[#4f46e5] dark:text-[#818cf8]">unified.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-base md:text-lg leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
              Atlas brings HR, Finance, and Project Management into a beautifully unified,
              editorial-grade cloud workspace — built for high-performance teams.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-[#ffffff] dark:bg-[#6366f1] dark:hover:bg-[#4f46e5] font-semibold px-8 py-6 text-base transition-all rounded-md shadow-md"
                asChild
              >
                <Link href="/register">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-[#d3cec6] dark:border-[#27272a] bg-transparent hover:bg-[#111111]/5 dark:hover:bg-[#f4f4f5]/5 text-[#111111] dark:text-[#f4f4f5] font-semibold px-8 py-6 text-base transition-all rounded-md"
                asChild
              >
                <Link href="/login">Sign in to workspace</Link>
              </Button>
            </div>

            {/* Highlights */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 border-t border-dashed border-[#d3cec6] dark:border-[#27272a]">
              {highlights.map((h) => (
                <span key={h} className="flex items-center gap-2 text-sm text-[#7b7b78] dark:text-[#71717a]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff]/30 dark:bg-[#09090b]/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            {/* Section Header */}
            <div className="mb-20 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a]">
                Platform Modules
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                Everything your team needs
              </h2>
              <p className="mt-4 max-w-xl mx-auto text-sm text-[#626260] dark:text-[#a1a1aa]">
                A complete suite of business tools, designed to work together seamlessly from day one.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={`group rounded-xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-8 transition-all duration-300 shadow-none flex flex-col justify-between ${f.hoverBorder}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <div className={`inline-flex rounded-lg border p-3 ${f.iconClass}`}>
                        <f.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#7b7b78] dark:text-[#71717a]">{f.num}</span>
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-[#111111] dark:text-[#f4f4f5] tracking-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">{f.description}</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#f5f1ec] dark:border-[#1a1a1e] flex items-center justify-between text-xs font-semibold text-[#111111] dark:text-[#f4f4f5] group-hover:text-[#4f46e5] dark:group-hover:text-[#818cf8] transition-colors">
                    <span>Learn more</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Clean Editorial Bento Banner - Premium Rich Slate Blue context */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-[100px] pointer-events-none" />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="rounded-2xl border border-[#d3cec6] dark:border-[#27272a] bg-[#111322] dark:bg-[#0c0d16] border-indigo-950/20 dark:border-indigo-950/60 p-12 md:p-16 shadow-lg text-left md:text-center relative overflow-hidden">
              {/* Background ambient lighting in the card */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/10 blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-[40px] pointer-events-none" />

              <Globe className="mx-auto mb-6 h-10 w-10 text-indigo-400" />
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white">
                Ready to modernise your operations?
              </h2>
              <p className="mt-4 text-sm text-indigo-200/70 max-w-md mx-auto">
                Join forward-thinking enterprise teams already running their daily workflow on Atlas.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-slate-100 text-[#0c0d16] font-semibold px-8 py-5 transition-all rounded-md shadow-md"
                  asChild
                >
                  <Link href="/register">
                    Create your workspace
                    <ArrowRight className="ml-2 h-4 w-4 text-[#0c0d16]" />
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="border border-white/10 hover:border-white/20 text-white hover:text-white bg-white/5 hover:bg-white/10 font-semibold px-8 py-5 transition-all rounded-md"
                  asChild
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="py-24 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/50 dark:bg-[#09090b]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 rounded-2xl border border-[#d3cec6] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#121214] p-8 md:p-12 shadow-sm">
              <div className="max-w-xl text-left">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">
                  Have questions? We're here to help.
                </h2>
                <p className="mt-4 text-sm text-[#626260] dark:text-[#a1a1aa] leading-relaxed">
                  Whether you need technical support, have a feature request, or just want to say hello, our team is ready to assist you.
                </p>
              </div>
              <div className="flex flex-col items-start gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] mb-0.5">Email Support</p>
                    <a href="mailto:workspace.atlas@protonmail.com" className="text-base font-semibold text-[#111111] dark:text-[#f4f4f5] hover:text-[#4f46e5] transition-colors">
                      workspace.atlas@protonmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d3cec6] dark:border-[#27272a] py-12 bg-[#ffffff]/20 dark:bg-[#09090b]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#7b7b78] dark:text-[#71717a]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 select-none">
              <Logo variant="mark" width={20} height={20} />
              <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">Atlas ERP</span>
            </div>
            <span>© 2026 Atlas Inc. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <a href="mailto:workspace.atlas@protonmail.com" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Contact
            </a>
            <Link href="/terms" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
