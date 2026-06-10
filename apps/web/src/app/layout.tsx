import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Atlas ERP — Enterprise Cloud Suite',
    template: '%s | Atlas ERP',
  },
  description:
    'Atlas ERP is an AI-powered, enterprise-grade Cloud ERP Suite for modern businesses. Manage HR, Finance, and Projects in one unified platform.',
  keywords: ['ERP', 'Enterprise', 'Cloud', 'HR', 'Finance', 'Business Management', 'Atlas'],
  authors: [{ name: 'Amdox' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Atlas ERP — Enterprise Cloud Suite',
    description: 'AI-powered Cloud ERP Suite for modern businesses.',
    type: 'website',
  },
  verification: {
    google: 'E4M2yFZRO6dOA1N8HOC9WJFipUVZUaOK9mpnBbTK4Tc',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#060d1a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans">
        <NextTopLoader
          color="#5e6ad2"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #5e6ad2,0 0 5px #5e6ad2"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delayDuration={400}>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
