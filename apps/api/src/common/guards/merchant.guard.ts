import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole, PlatformRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MEMBER_ROLES_KEY } from '../decorators/member-roles.decorator';
import type { AuthedRequest } from '../types/request-context';

/**
 * 租户守卫：校验当前用户是路由 :merchantId 商家的成员，
 * 并把 merchantContext 注入请求；同时执行 @MemberRoles 角色校验。
 * 平台管理员可访问任意商家（OWNER 视角）。
 */
@Injectable()
export class MerchantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const rawParam = req.params.merchantId;
    const merchantId = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    if (!merchantId) throw new NotFoundException('缺少 merchantId');

    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId }, select: { id: true } });
    if (!merchant) throw new NotFoundException('商家不存在');

    let role: MemberRole;
    if (req.user.platformRole === PlatformRole.ADMIN) {
      role = MemberRole.OWNER;
    } else {
      const membership = await this.prisma.merchantMember.findUnique({
        where: { merchantId_userId: { merchantId, userId: req.user.sub } },
        select: { role: true },
      });
      if (!membership) throw new ForbiddenException('无权访问该商家');
      role = membership.role;
    }

    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(MEMBER_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.includes(role)) {
      throw new ForbiddenException('该操作仅限商家老板');
    }

    req.merchantContext = { merchantId, role };
    return true;
  }
}
