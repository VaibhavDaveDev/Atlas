'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { workspace, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const role = workspace?.role;
    if (!role || !['OWNER', 'ADMIN'].includes(role)) {
      router.replace('/dashboard');
    }
  }, [workspace, isLoading, router]);

  if (isLoading) return null;

  const role = workspace?.role;
  if (!role || !['OWNER', 'ADMIN'].includes(role)) return null;

  return <>{children}</>;
}
