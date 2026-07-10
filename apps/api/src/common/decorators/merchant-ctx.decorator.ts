import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest, MerchantContext } from '../types/request-context';

/** 取 MerchantGuard 注入的租户上下文（必须与 MerchantGuard 联用） */
export const MerchantCtx = createParamDecorator((_: unknown, ctx: ExecutionContext): MerchantContext => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.merchantContext) {
    throw new Error('MerchantCtx 必须与 MerchantGuard 联用');
  }
  return req.merchantContext;
});
