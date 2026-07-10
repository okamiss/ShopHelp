import { Injectable } from '@nestjs/common';
import { CustomerStatus, FollowTaskStatus, IntentLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../ai/usage.service';

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

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  async summary(merchantId: string) {
    const [todayTasks, followUpCustomers, highIntentCustomers, recentGenerations, usageSummary, stats] =
      await Promise.all([
        // 今日待办（含逾期未完成）
        this.prisma.followTask.findMany({
          where: { merchantId, status: FollowTaskStatus.PENDING, dueDate: { lte: endOfToday() } },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
          take: 20,
          select: {
            id: true,
            title: true,
            note: true,
            dueDate: true,
            status: true,
            source: true,
            customer: { select: { id: true, name: true, intentLevel: true } },
          },
        }),
        // 待跟进客户（下次跟进时间已到/已过）
        this.prisma.customer.findMany({
          where: {
            merchantId,
            nextFollowAt: { lte: endOfToday() },
            status: { notIn: [CustomerStatus.LOST] },
          },
          orderBy: { nextFollowAt: 'asc' },
          take: 10,
          select: {
            id: true,
            name: true,
            intentLevel: true,
            status: true,
            nextFollowAt: true,
            lastContactAt: true,
            remark: true,
          },
        }),
        // 高意向客户
        this.prisma.customer.findMany({
          where: {
            merchantId,
            intentLevel: IntentLevel.A,
            status: { notIn: [CustomerStatus.LOST] },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: { id: true, name: true, status: true, remark: true, nextFollowAt: true },
        }),
        // 最近生成记录
        this.prisma.aiGeneration.findMany({
          where: { merchantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, type: true, scenario: true, output: true, createdAt: true, isFavorite: true },
        }),
        this.usage.summary(merchantId),
        this.stats(merchantId),
      ]);

    return {
      todayTasks,
      followUpCustomers,
      highIntentCustomers,
      recentGenerations,
      usage: usageSummary,
      stats,
      suggestions: await this.buildSuggestions(merchantId, {
        todayTaskCount: todayTasks.length,
        followUpCount: followUpCustomers.length,
        highIntentCount: highIntentCustomers.length,
      }),
    };
  }

  private async stats(merchantId: string) {
    const [customerTotal, dealCount, pendingTaskCount] = await Promise.all([
      this.prisma.customer.count({ where: { merchantId } }),
      this.prisma.customer.count({
        where: { merchantId, status: { in: [CustomerStatus.DEAL, CustomerStatus.REPURCHASED] } },
      }),
      this.prisma.followTask.count({ where: { merchantId, status: FollowTaskStatus.PENDING } }),
    ]);
    return { customerTotal, dealCount, pendingTaskCount };
  }

  /** 今日 AI 建议：基于经营数据的规则建议（不消耗 LLM 配额） */
  private async buildSuggestions(
    merchantId: string,
    counts: { todayTaskCount: number; followUpCount: number; highIntentCount: number },
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const [sleepingCount, uncontactedCount] = await Promise.all([
      this.prisma.customer.count({
        where: {
          merchantId,
          status: { notIn: [CustomerStatus.LOST] },
          OR: [{ lastContactAt: { lt: thirtyDaysAgo } }, { lastContactAt: null, createdAt: { lt: thirtyDaysAgo } }],
        },
      }),
      this.prisma.customer.count({ where: { merchantId, status: CustomerStatus.UNCONTACTED } }),
    ]);

    if (counts.followUpCount > 0) {
      suggestions.push(`有 ${counts.followUpCount} 位客户到了跟进时间，优先处理今天的待跟进列表`);
    }
    if (counts.highIntentCount > 0) {
      suggestions.push(`${counts.highIntentCount} 位高意向（A 级）客户值得重点推进，可用「成交催单」话术临门一脚`);
    }
    if (sleepingCount > 0) {
      suggestions.push(`${sleepingCount} 位客户超过 30 天没有联系，试试「沉睡客户唤醒」文案拉回来`);
    }
    if (uncontactedCount > 0) {
      suggestions.push(`还有 ${uncontactedCount} 位新客户未建立首次沟通，越早破冰成交率越高`);
    }
    if (suggestions.length === 0) {
      suggestions.push('今天客户侧没有紧急事项，适合发一条朋友圈保持活跃度，可以去文案中心生成');
    }
    return suggestions.slice(0, 4);
  }
}
