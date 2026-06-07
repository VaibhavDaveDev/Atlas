import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';

export const metadata: Metadata = {
  title: 'Privacy Policy — Atlas ERP',
  description: 'Privacy policy and data handling practices for the Atlas ERP platform.',
};

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111111] dark:text-[#f4f4f5]">Privacy Policy</h1>
            <p className="text-sm text-[#7b7b78] dark:text-[#71717a] font-medium">Last updated: June 7, 2026</p>
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">1. Introduction</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                At Atlas ERP, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">2. Information We Collect</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                We may collect information about you in a variety of ways. The information we may collect includes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and company details, that you voluntarily give to us when you register for the Service.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, and your access times.</li>
                <li><strong>Usage Data:</strong> We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">3. Use of Your Information</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                <li>Create and manage your account.</li>
                <li>Deliver targeted advertising, coupons, newsletters, and other information regarding promotions and the Service to you.</li>
                <li>Email you regarding your account or order.</li>
                <li>Increase the efficiency and operation of the Service.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">4. Disclosure of Your Information</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#626260] dark:text-[#a1a1aa]">
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">5. Security of Your Information</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">6. Cookies and Tracking Technologies</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Service to help customize the Site and improve your experience. When you access the Service, your personal information is not collected through the use of tracking technology. Most browsers are set to accept cookies by default.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">7. Contact Us</h2>
              <p className="text-sm leading-relaxed text-[#626260] dark:text-[#a1a1aa]">
                If you have questions or comments about this Privacy Policy, please contact us at: <br/>
                <strong>Email:</strong> workspace.atlas@protonmail.com
              </p>
            </section>
          </div>
        </div>
      </main>

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
            <Link href="/privacy" className="hover:text-[#4f46e5] dark:hover:text-[#818cf8] transition-colors">
              Privacy
            </Link>
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

function Separator() {
  return <div className="h-px w-full bg-[#d3cec6] dark:bg-[#27272a] opacity-50" />;
}
