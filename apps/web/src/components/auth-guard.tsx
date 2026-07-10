'use client';

import { Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * 登录态守卫：
 * - 未登录 → /login
 * - 已登录但无商家 → /onboarding
 */
export function AuthGuard({ children, requireMerchant = true }: { children: React.ReactNode; requireMerchant?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, accessToken, activeMerchantId } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireMerchant && !activeMerchantId) {
      router.replace('/onboarding');
    }
  }, [hydrated, accessToken, activeMerchantId, requireMerchant, router, pathname]);

  if (!hydrated || !accessToken || (requireMerchant && !activeMerchantId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
}
