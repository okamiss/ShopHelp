import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { AuthedRequest } from '../common/types/request-context';
import { UsageService } from './usage.service';

/**
 * 配额守卫：AI 生成接口调用前校验当日/当月次数。
 * 必须在 MerchantGuard 之后执行（依赖 merchantContext）。
 */
@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly usage: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const merchantId = req.merchantContext?.merchantId;
    if (!merchantId) return false;

    const summary = await this.usage.summary(merchantId);
    if (summary.dailyUsed >= summary.dailyLimit) {
      throw new HttpException(
        `今日 AI 生成次数已用完（${summary.dailyLimit} 次），明天再来或升级套餐`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (summary.monthlyUsed >= summary.monthlyLimit) {
      throw new HttpException(
        `本月 AI 生成次数已用完（${summary.monthlyLimit} 次），请升级套餐`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
