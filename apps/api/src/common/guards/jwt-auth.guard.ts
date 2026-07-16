import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthedRequest, AuthUser } from '../types/request-context';
import { UsersService } from '../../users/users.service';

/** 全局 JWT 守卫：默认所有路由需登录，@Public() 放行 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('未登录');

    let user: AuthUser;
    try {
      user = await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    const status = await this.users.findStatusById(user.sub);
    if (!status) throw new UnauthorizedException('用户不存在');
    if (status.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }

    req.user = user;
    return true;
  }

  private extractToken(req: AuthedRequest): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
