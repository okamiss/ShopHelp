import { Injectable, Logger } from '@nestjs/common';
import { CustomerStatus, FollowTaskStatus, PlanType } from '@prisma/client';
import { AUDIT_ACTIONS, PLANS } from '@shophelp/shared';
import { AuditService } from '../admin/audit.service';
import { PrismaService } from '../prisma/prisma.service';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 每日待办生成：为「今天到了下次跟进时间」的客户自动创建 AUTO 跟进任务。
 * 幂等：同客户当天已存在待办则跳过。
 */
@Injectable()
export class DailyTasksService {
  private readonly logger = new Logger(DailyTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateForAllMerchants() {
    const downgraded = await this.downgradeExpiredSubscriptions();
    const merchants = await this.prisma.merchant.findMany({ select: { id: true } });
    let created = 0;
    for (const merchant of merchants) {
      created += await this.generateForMerchant(merchant.id);
    }
    this.logger.log(`每日任务完成：降级 ${downgraded} 个套餐，创建 ${created} 条待办`);
    return { merchants: merchants.length, created, downgraded };
  }

  private async downgradeExpiredSubscriptions(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.subscription.findMany({
      where: { plan: PlanType.PRO, expiresAt: { lt: now } },
      select: { id: true, merchantId: true, expiresAt: true },
    });
    const free = PLANS[PlanType.FREE];
    let downgraded = 0;

    for (const subscription of expired) {
      const changed = await this.prisma.$transaction(async (tx) => {
        const result = await tx.subscription.updateMany({
          where: {
            id: subscription.id,
            plan: PlanType.PRO,
            expiresAt: { lt: now },
          },
          data: {
            plan: PlanType.FREE,
            dailyGenerationLimit: free.dailyGenerationLimit,
            monthlyGenerationLimit: free.monthlyGenerationLimit,
            expiresAt: null,
          },
        });
        if (result.count === 0) return false;

        await this.audit.log(
          null,
          AUDIT_ACTIONS.SUBSCRIPTION_EXPIRED,
          'MERCHANT',
          subscription.merchantId,
          {
            previousPlan: PlanType.PRO,
            plan: PlanType.FREE,
            expiredAt: subscription.expiresAt?.toISOString() ?? null,
          },
          tx,
        );
        return true;
      });
      if (changed) downgraded++;
    }
    return downgraded;
  }

  async generateForMerchant(merchantId: string): Promise<number> {
    const dueCustomers = await this.prisma.customer.findMany({
      where: {
        merchantId,
        nextFollowAt: { gte: startOfToday(), lte: endOfToday() },
        status: { notIn: [CustomerStatus.LOST] },
      },
      select: { id: true, name: true, remark: true },
    });

    let created = 0;
    for (const customer of dueCustomers) {
      const exists = await this.prisma.followTask.findFirst({
        where: {
          merchantId,
          customerId: customer.id,
          status: FollowTaskStatus.PENDING,
          dueDate: { gte: startOfToday(), lte: endOfToday() },
        },
        select: { id: true },
      });
      if (exists) continue;

      await this.prisma.followTask.create({
        data: {
          merchantId,
          customerId: customer.id,
          title: `今天该跟进「${customer.name}」了`,
          note: customer.remark ? `客户备注：${customer.remark}` : undefined,
          dueDate: startOfToday(),
          source: 'AUTO',
        },
      });
      created++;
    }
    return created;
  }
}
