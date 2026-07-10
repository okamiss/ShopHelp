import { MemberRole, PlatformRole } from '@prisma/client';
import type { Request } from 'express';

/** JWT payload / 认证后的用户信息 */
export interface AuthUser {
  sub: string;
  email: string;
  platformRole: PlatformRole;
}

/** MerchantGuard 注入的租户上下文 */
export interface MerchantContext {
  merchantId: string;
  /** 当前用户在该商家内的角色；平台管理员访问时为 OWNER 视角 */
  role: MemberRole;
}

export interface AuthedRequest extends Request {
  user: AuthUser;
  merchantContext?: MerchantContext;
}
