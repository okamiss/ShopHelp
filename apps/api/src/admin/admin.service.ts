import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const today = startOfToday();
    const [merchantCount, userCount, customerCount, generationCount, todayUsage] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.user.count(),
      this.prisma.customer.count(),
      this.prisma.aiGeneration.count(),
      this.prisma.usageRecord.aggregate({ where: { date: today }, _sum: { count: true, tokensUsed: true } }),
    ]);
    return {
      merchantCount,
      userCount,
      customerCount,
      generationCount,
      todayGenerations: todayUsage._sum.count ?? 0,
      todayTokens: todayUsage._sum.tokensUsed ?? 0,
    };
  }

  async listMerchants(page = 1, pageSize = 20, keyword?: string) {
    const where: Prisma.MerchantWhereInput = keyword ? { name: { contains: keyword } } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.merchant.findMany({
        where,
        select: {
          id: true,
          name: true,
          industry: true,
          createdAt: true,
          owner: { select: { id: true, email: true, name: true } },
          subscription: { select: { plan: true, expiresAt: true } },
          _count: { select: { customers: true, members: true, generations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.merchant.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async listUsers(page = 1, pageSize = 20, keyword?: string) {
    const where: Prisma.UserWhereInput = keyword
      ? { OR: [{ email: { contains: keyword } }, { name: { contains: keyword } }] }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          platformRole: true,
          createdAt: true,
          memberships: { select: { role: true, merchant: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** 最近 N 天用量（按天聚合，供后台图表） */
  async usageTrend(days = 14) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);
    const rows = await this.prisma.usageRecord.groupBy({
      by: ['date'],
      where: { date: { gte: from } },
      _sum: { count: true, tokensUsed: true },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      count: r._sum.count ?? 0,
      tokensUsed: r._sum.tokensUsed ?? 0,
    }));
  }
}
