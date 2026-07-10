import { Injectable } from '@nestjs/common';
import { GenerationType, PlanType } from '@prisma/client';
import { PLANS } from '@shophelp/shared';
import { PrismaService } from '../prisma/prisma.service';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface UsageSummary {
  plan: PlanType;
  planLabel: string;
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  expiresAt: Date | null;
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(merchantId: string): Promise<UsageSummary> {
    const subscription = await this.prisma.subscription.findUnique({ where: { merchantId } });
    const plan = subscription?.plan ?? PlanType.FREE;
    const planDef = PLANS[plan];

    const [daily, monthly] = await Promise.all([
      this.prisma.usageRecord.aggregate({
        where: { merchantId, date: startOfToday() },
        _sum: { count: true },
      }),
      this.prisma.usageRecord.aggregate({
        where: { merchantId, date: { gte: startOfMonth() } },
        _sum: { count: true },
      }),
    ]);

    return {
      plan,
      planLabel: planDef.label,
      dailyUsed: daily._sum.count ?? 0,
      dailyLimit: subscription?.dailyGenerationLimit ?? planDef.dailyGenerationLimit,
      monthlyUsed: monthly._sum.count ?? 0,
      monthlyLimit: subscription?.monthlyGenerationLimit ?? planDef.monthlyGenerationLimit,
      expiresAt: subscription?.expiresAt ?? null,
    };
  }

  /** AI 生成成功后记账（按日按类型聚合） */
  async record(merchantId: string, type: GenerationType, tokensUsed: number) {
    const date = startOfToday();
    await this.prisma.usageRecord.upsert({
      where: { merchantId_date_type: { merchantId, date, type } },
      update: { count: { increment: 1 }, tokensUsed: { increment: tokensUsed } },
      create: { merchantId, date, type, count: 1, tokensUsed },
    });
  }
}
