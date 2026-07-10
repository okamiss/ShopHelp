import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResult, Membership, UserInfo } from '@/lib/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  memberships: Membership[];
  activeMerchantId: string | null;
  /** persist 是否已从 localStorage 恢复（避免 SSR 闪跳） */
  hydrated: boolean;
  setSession: (result: AuthResult) => void;
  setActiveMerchant: (merchantId: string) => void;
  setMemberships: (memberships: Membership[]) => void;
  clear: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      memberships: [],
      activeMerchantId: null,
      hydrated: false,

      setSession: (result) => {
        const current = get().activeMerchantId;
        const stillValid = result.memberships.some((m) => m.merchant.id === current);
        set({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
          memberships: result.memberships,
          activeMerchantId: stillValid ? current : (result.memberships[0]?.merchant.id ?? null),
        });
      },

      setActiveMerchant: (merchantId) => set({ activeMerchantId: merchantId }),

      setMemberships: (memberships) =>
        set((state) => ({
          memberships,
          activeMerchantId:
            state.activeMerchantId && memberships.some((m) => m.merchant.id === state.activeMerchantId)
              ? state.activeMerchantId
              : (memberships[0]?.merchant.id ?? null),
        })),

      clear: () =>
        set({ accessToken: null, refreshToken: null, user: null, memberships: [], activeMerchantId: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'shophelp-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        memberships: s.memberships,
        activeMerchantId: s.activeMerchantId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
