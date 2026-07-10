import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import type { AuthedRequest } from '../types/request-context';

/** 平台管理员守卫（用于 /admin 模块） */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (req.user?.platformRole !== PlatformRole.ADMIN) {
      throw new ForbiddenException('仅平台管理员可访问');
    }
    return true;
  }
}
