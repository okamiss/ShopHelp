'use client';

import { useAuthStore } from '@/stores/auth-store';

/** 当前商家 id（AuthGuard 保证非空后使用） */
export function useMerchantId(): string {
  const id = useAuthStore((s) => s.activeMerchantId);
  return id ?? '';
}
