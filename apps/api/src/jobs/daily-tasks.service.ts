import { Injectable, Logger } from '@nestjs/common';
import { CustomerStatus, FollowTaskStatus } from '@prisma/client';
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

  constructor(private readonly prisma: PrismaService) {}

  async generateForAllMerchants() {
    const merchants = await this.prisma.merchant.findMany({ select: { id: true } });
    let created = 0;
    for (const merchant of merchants) {
      created += await this.generateForMerchant(merchant.id);
    }
    this.logger.log(`每日待办生成完成，共创建 ${created} 条任务`);
    return { merchants: merchants.length, created };
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
