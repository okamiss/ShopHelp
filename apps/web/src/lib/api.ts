import type { IndustryDef, PlanDef, PlanType, ScenarioDef } from '@shophelp/shared';
import { apiClient } from './api-client';
import type {
  AdminMerchant,
  AdminStats,
  AdminUser,
  AuthResult,
  Customer,
  CustomerDetail,
  CustomerNote,
  CustomerTag,
  DashboardData,
  FollowTask,
  Generation,
  Merchant,
  MerchantMember,
  Paginated,
  Product,
  UsageSummary,
  UserInfo,
  Membership,
} from './types';

// ---------- auth ----------

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResult>('/auth/login', data).then((r) => r.data),
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post<AuthResult>('/auth/register', data).then((r) => r.data),
  me: () => apiClient.get<{ user: UserInfo; memberships: Membership[] }>('/auth/me').then((r) => r.data),
};

// ---------- meta ----------

export const metaApi = {
  industries: () => apiClient.get<IndustryDef[]>('/meta/industries').then((r) => r.data),
  scenarios: () =>
    apiClient.get<{ copywriting: ScenarioDef[]; reply: ScenarioDef[] }>('/meta/scenarios').then((r) => r.data),
  plans: () => apiClient.get<Record<PlanType, PlanDef>>('/meta/plans').then((r) => r.data),
};

// ---------- merchant ----------

export const merchantApi = {
  create: (data: Partial<Merchant> & { name: string; industry: string }) =>
    apiClient.post<Merchant>('/merchants', data).then((r) => r.data),
  get: (merchantId: string) => apiClient.get<Merchant>(`/merchants/${merchantId}`).then((r) => r.data),
  update: (merchantId: string, data: Partial<Merchant>) =>
    apiClient.patch<Merchant>(`/merchants/${merchantId}`, data).then((r) => r.data),
  members: (merchantId: string) =>
    apiClient.get<MerchantMember[]>(`/merchants/${merchantId}/members`).then((r) => r.data),
  addMember: (merchantId: string, data: { email: string; role?: string }) =>
    apiClient.post<MerchantMember>(`/merchants/${merchantId}/members`, data).then((r) => r.data),
  removeMember: (merchantId: string, memberId: string) =>
    apiClient.delete(`/merchants/${merchantId}/members/${memberId}`).then((r) => r.data),
};

// ---------- products ----------

export const productApi = {
  list: (merchantId: string) =>
    apiClient.get<Product[]>(`/merchants/${merchantId}/products`).then((r) => r.data),
  create: (merchantId: string, data: Partial<Product> & { name: string }) =>
    apiClient.post<Product>(`/merchants/${merchantId}/products`, data).then((r) => r.data),
  update: (merchantId: string, productId: string, data: Partial<Product>) =>
    apiClient.patch<Product>(`/merchants/${merchantId}/products/${productId}`, data).then((r) => r.data),
  remove: (merchantId: string, productId: string) =>
    apiClient.delete(`/merchants/${merchantId}/products/${productId}`).then((r) => r.data),
};

// ---------- customers ----------

export interface CustomerQuery {
  keyword?: string;
  intentLevel?: string;
  status?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
}

export const customerApi = {
  list: (merchantId: string, params: CustomerQuery = {}) =>
    apiClient.get<Paginated<Customer>>(`/merchants/${merchantId}/customers`, { params }).then((r) => r.data),
  get: (merchantId: string, customerId: string) =>
    apiClient.get<CustomerDetail>(`/merchants/${merchantId}/customers/${customerId}`).then((r) => r.data),
  create: (merchantId: string, data: Record<string, unknown>) =>
    apiClient.post<Customer>(`/merchants/${merchantId}/customers`, data).then((r) => r.data),
  update: (merchantId: string, customerId: string, data: Record<string, unknown>) =>
    apiClient.patch<Customer>(`/merchants/${merchantId}/customers/${customerId}`, data).then((r) => r.data),
  remove: (merchantId: string, customerId: string) =>
    apiClient.delete(`/merchants/${merchantId}/customers/${customerId}`).then((r) => r.data),
  addNote: (merchantId: string, customerId: string, content: string) =>
    apiClient
      .post<CustomerNote>(`/merchants/${merchantId}/customers/${customerId}/notes`, { content })
      .then((r) => r.data),
  tags: (merchantId: string) =>
    apiClient.get<CustomerTag[]>(`/merchants/${merchantId}/tags`).then((r) => r.data),
  createTag: (merchantId: string, data: { name: string; color?: string }) =>
    apiClient.post<CustomerTag>(`/merchants/${merchantId}/tags`, data).then((r) => r.data),
  removeTag: (merchantId: string, tagId: string) =>
    apiClient.delete(`/merchants/${merchantId}/tags/${tagId}`).then((r) => r.data),
};

// ---------- follow tasks ----------

export const taskApi = {
  list: (merchantId: string, params: { status?: string; date?: string; page?: number; pageSize?: number } = {}) =>
    apiClient.get<Paginated<FollowTask>>(`/merchants/${merchantId}/follow-tasks`, { params }).then((r) => r.data),
  create: (merchantId: string, data: { title: string; dueDate: string; customerId?: string; note?: string }) =>
    apiClient.post<FollowTask>(`/merchants/${merchantId}/follow-tasks`, data).then((r) => r.data),
  update: (merchantId: string, taskId: string, data: Record<string, unknown>) =>
    apiClient.patch<FollowTask>(`/merchants/${merchantId}/follow-tasks/${taskId}`, data).then((r) => r.data),
  remove: (merchantId: string, taskId: string) =>
    apiClient.delete(`/merchants/${merchantId}/follow-tasks/${taskId}`).then((r) => r.data),
};

// ---------- AI ----------

export const aiApi = {
  copywriting: (merchantId: string, data: { scenario: string; input?: string; productId?: string; customerId?: string }) =>
    apiClient.post<Generation>(`/merchants/${merchantId}/ai/copywriting`, data).then((r) => r.data),
  reply: (merchantId: string, data: { scenario: string; input: string; productId?: string; customerId?: string }) =>
    apiClient.post<Generation>(`/merchants/${merchantId}/ai/reply`, data).then((r) => r.data),
  followUp: (merchantId: string, data: { customerId: string; input?: string }) =>
    apiClient.post<Generation>(`/merchants/${merchantId}/ai/follow-up`, data).then((r) => r.data),
  generations: (
    merchantId: string,
    params: { type?: string; scenario?: string; favorite?: boolean; page?: number; pageSize?: number } = {},
  ) => apiClient.get<Paginated<Generation>>(`/merchants/${merchantId}/ai/generations`, { params }).then((r) => r.data),
  favorite: (merchantId: string, generationId: string, isFavorite: boolean) =>
    apiClient
      .patch<Generation>(`/merchants/${merchantId}/ai/generations/${generationId}/favorite`, { isFavorite })
      .then((r) => r.data),
  usage: (merchantId: string) =>
    apiClient.get<UsageSummary>(`/merchants/${merchantId}/ai/usage`).then((r) => r.data),
};

// ---------- dashboard ----------

export const dashboardApi = {
  summary: (merchantId: string) =>
    apiClient.get<DashboardData>(`/merchants/${merchantId}/dashboard`).then((r) => r.data),
};

// ---------- admin ----------

export const adminApi = {
  stats: () => apiClient.get<AdminStats>('/admin/stats').then((r) => r.data),
  merchants: (params: { page?: number; pageSize?: number; keyword?: string } = {}) =>
    apiClient.get<Paginated<AdminMerchant>>('/admin/merchants', { params }).then((r) => r.data),
  users: (params: { page?: number; pageSize?: number; keyword?: string } = {}) =>
    apiClient.get<Paginated<AdminUser>>('/admin/users', { params }).then((r) => r.data),
  usageTrend: (days = 14) =>
    apiClient
      .get<{ date: string; count: number; tokensUsed: number }[]>('/admin/usage-trend', { params: { days } })
      .then((r) => r.data),
};
