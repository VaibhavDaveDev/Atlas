import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';

export const metadata: Metadata = {
  title: 'Terms and Conditions — Atlas ERP',
  description: 'Generic terms and conditions for using the Atlas ERP platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ec] dark:bg-[#09090b] text-[#111111] dark:text-[#f4f4f5] flex flex-col transition-colors duration-300 font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#d3cec6] dark:border-[#27272a] bg-[#f5f1ec]/90 dark:bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <Logo variant="mark" width={32} height={32} />
            <span className="text-lg font-semibold tracking-[-0.02em] text-[#111111] dark:text-[#f4f4f5]">Atlas ERP</span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-[#626260] dark:text-[#a1a1aa] hover:text-[#111111] dark:hover:text-[#f4f4f5]">
            <Link href="/">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to home
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Shield className="h-3.5 w-3.5" />
              Legal Policy
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Terms and Conditions</h1>
            <p className="text-sm text-[#7b7b78] dark:text-[#71717a] font-medium">Last updated: June 4, 2026</p>
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                By accessing and using the Atlas ERP platform (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the Service. These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">2. Use License</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                Permission is granted to temporarily use the Service for personal or internal business purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial) without explicit consent;</li>
                <li>Attempt to decompile or reverse engineer any software contained on the Service;</li>
                <li>Remove any copyright or other proprietary notations from the materials;</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">3. Disclaimer</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                The materials on the Service are provided on an 'as is' basis. Atlas Inc. makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">4. Limitations</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                In no event shall Atlas Inc. or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service, even if Atlas Inc. or an Atlas Inc. authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">5. User Accounts</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">6. Governing Law</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Atlas Inc. is established, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">7. Changes to Terms</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                Atlas Inc. reserves the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#d3cec6] dark:border-[#27272a] py-12 bg-[#ffffff]/20 dark:bg-[#09090b]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#7b7b78] dark:text-[#71717a]">
          <div className="flex items-center gap-2 select-none">
            <Logo variant="mark" width={20} height={20} />
            <span className="font-semibold text-[#111111] dark:text-[#f4f4f5]">Atlas ERP</span>
          </div>
          <span>© 2026 Atlas Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-[#d3cec6] dark:bg-[#27272a] opacity-50" />;
}
