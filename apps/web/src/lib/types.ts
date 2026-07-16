import type {
  CustomerStatus,
  FollowTaskStatus,
  GenerationOutput,
  GenerationType,
  IntentLevel,
  MemberRole,
  PlanType,
} from '@shophelp/shared';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  platformRole: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'DISABLED';
  mustChangePassword: boolean;
  isPlatformAdmin?: boolean;
}

export interface Membership {
  role: MemberRole;
  merchant: { id: string; name: string; industry: string };
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
  memberships: Membership[];
}

export interface Merchant {
  id: string;
  name: string;
  industry: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  businessHours?: string | null;
  brandTone?: string | null;
  targetCustomers?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  subscription?: Subscription | null;
  _count?: { customers: number; products: number; members: number };
}

export interface Subscription {
  plan: PlanType;
  dailyGenerationLimit: number;
  monthlyGenerationLimit: number;
  startedAt: string;
  expiresAt: string | null;
}

export interface MerchantMember {
  id: string;
  role: MemberRole;
  createdAt?: string;
  user: { id: string; email: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  category?: string | null;
  price?: string | number | null;
  unit?: string | null;
  description?: string | null;
  sellingPoints?: string | null;
  status: 'ON' | 'OFF';
  sortOrder: number;
  createdAt: string;
}

export interface CustomerTag {
  id: string;
  name: string;
  color?: string | null;
  _count?: { customers: number };
}

export interface Customer {
  id: string;
  name: string;
  wechat?: string | null;
  phone?: string | null;
  source?: string | null;
  intentLevel: IntentLevel;
  status: CustomerStatus;
  remark?: string | null;
  nextFollowAt?: string | null;
  lastContactAt?: string | null;
  createdAt: string;
  tags: CustomerTag[];
}

export interface CustomerNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export interface CustomerDetail extends Customer {
  notes: CustomerNote[];
  followTasks: FollowTask[];
  generations: Generation[];
}

export interface FollowTask {
  id: string;
  title: string;
  note?: string | null;
  dueDate: string;
  status: FollowTaskStatus;
  source?: string;
  createdAt?: string;
  customer?: { id: string; name: string; intentLevel?: IntentLevel; status?: CustomerStatus } | null;
}

export interface Generation {
  id: string;
  type: GenerationType;
  scenario: string;
  inputParams?: { input?: string | null; productId?: string | null; customerId?: string | null };
  output: GenerationOutput;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  isFavorite: boolean;
  createdAt: string;
  customer?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
}

export interface UsageSummary {
  plan: PlanType;
  planLabel: string;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  expiresAt: string | null;
}

export interface DashboardData {
  todayTasks: FollowTask[];
  followUpCustomers: Customer[];
  highIntentCustomers: Pick<Customer, 'id' | 'name' | 'status' | 'remark' | 'nextFollowAt'>[];
  recentGenerations: Generation[];
  usage: UsageSummary;
  stats: { customerTotal: number; dealCount: number; pendingTaskCount: number };
  suggestions: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Admin ----

export interface AdminStats {
  merchantCount: number;
  userCount: number;
  customerCount: number;
  generationCount: number;
  todayGenerations: number;
  todayTokens: number;
}

export interface AdminMerchant {
  id: string;
  name: string;
  industry: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  owner: { id: string; email: string; name: string };
  subscription?: {
    plan: PlanType;
    dailyGenerationLimit: number;
    monthlyGenerationLimit: number;
    expiresAt: string | null;
  } | null;
  _count: { customers: number; members: number; generations: number };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  platformRole: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'DISABLED';
  mustChangePassword: boolean;
  createdAt: string;
  memberships: { role: MemberRole; merchant: { id: string; name: string } }[];
}

export interface AdminAuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: unknown;
  createdAt: string;
  admin: { id: string; email: string; name: string } | null;
}
