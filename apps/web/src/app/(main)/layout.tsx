'use client';

import { AuthGuard } from '@/components/auth-guard';
import { MainLayout } from '@/components/main-layout';

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
