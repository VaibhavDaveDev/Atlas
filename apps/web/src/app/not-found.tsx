'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#f5f1ec] dark:bg-[#09090b]">
      {/* Number */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b7b78] dark:text-[#71717a] mb-6">
        Error 404
      </p>
      <h1 className="text-8xl md:text-9xl font-semibold tracking-[-0.05em] text-[#111111] dark:text-[#f4f4f5] leading-none select-none">
        404
      </h1>

      <h2 className="mt-8 text-xl font-semibold tracking-tight text-[#111111] dark:text-[#f4f4f5]">
        Page not found
      </h2>
      <p className="mt-3 text-sm text-[#626260] dark:text-[#a1a1aa] max-w-sm leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-10">
        <Button
          asChild
          size="lg"
          className="rounded-xl h-11 px-8 bg-[#111111] hover:bg-[#222222] text-white dark:bg-[#f4f4f5] dark:hover:bg-[#e4e4e7] dark:text-[#09090b] font-semibold shadow-sm"
        >
          <Link href="/dashboard">
            <Home className="mr-2.5 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
