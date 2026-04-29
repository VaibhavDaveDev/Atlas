'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = 'full', className, width, height }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder to avoid layout shift
    return (
      <div
        className={cn('animate-pulse rounded bg-muted', className)}
        style={{ width: width ?? (variant === 'full' ? 120 : 32), height: height ?? 32 }}
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'mark') {
    return (
      <Image
        src={isDark ? '/images/logo-mark-dark-nobg.PNG' : '/images/logo-mark-light-nobg.PNG'}
        alt="Atlas ERP"
        width={width ?? 32}
        height={height ?? 32}
        className={className}
        priority
      />
    );
  }

  return (
    <Image
      src={isDark ? '/images/logo-full-dark-nobg.PNG' : '/images/logo-full-light-nobg.PNG'}
      alt="Atlas ERP"
      width={width ?? 120}
      height={height ?? 32}
      className={cn('object-contain', className)}
      priority
    />
  );
}
