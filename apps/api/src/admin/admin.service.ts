import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PlatformRole, Prisma } from '@prisma/client';
import { AUDIT_ACTIONS, PLANS } from '@shophelp/shared';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { DailyTasksService } from '../jobs/daily-tasks.service';
import { UpdateMerchantDto } from '../merchants/dto/merchant.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import {
  UpdateAdminUserDto,
  UpdateMerchantStatusDto,
  UpdateSubscriptionDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly dailyTasks: DailyTasksService,
  ) {}

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
          status: true,
          createdAt: true,
          owner: { select: { id: true, email: true, name: true } },
          subscription: {
            select: {
              plan: true,
              dailyGenerationLimit: true,
              monthlyGenerationLimit: true,
              expiresAt: true,
            },
          },
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
          status: true,
          mustChangePassword: true,
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

  updateMerchant(adminId: string, merchantId: string, dto: UpdateMerchantDto) {
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({ where: { id: merchantId }, select: { id: true } });
      if (!merchant) throw new NotFoundException('商家不存在');

      const updated = await tx.merchant.update({ where: { id: merchantId }, data: dto });
      await this.audit.log(
        adminId,
        AUDIT_ACTIONS.MERCHANT_UPDATE,
        'MERCHANT',
        merchantId,
        { changes: dto as Prisma.InputJsonObject },
        tx,
      );
      return updated;
    });
  }

  updateMerchantStatus(adminId: string, merchantId: string, dto: UpdateMerchantStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { id: true, status: true },
      });
      if (!merchant) throw new NotFoundException('商家不存在');

      const updated = await tx.merchant.update({ where: { id: merchantId }, data: { status: dto.status } });
      await this.audit.log(
        adminId,
        AUDIT_ACTIONS.MERCHANT_STATUS,
        'MERCHANT',
        merchantId,
        { previousStatus: merchant.status, status: dto.status },
        tx,
      );
      return updated;
    });
  }

  updateSubscription(adminId: string, merchantId: string, dto: UpdateSubscriptionDto) {
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({ where: { id: merchantId }, select: { id: true } });
      if (!merchant) throw new NotFoundException('商家不存在');

      const plan = PLANS[dto.plan];
      const data = {
        plan: dto.plan,
        dailyGenerationLimit: dto.dailyGenerationLimit ?? plan.dailyGenerationLimit,
        monthlyGenerationLimit: dto.monthlyGenerationLimit ?? plan.monthlyGenerationLimit,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      };
      const subscription = await tx.subscription.upsert({
        where: { merchantId },
        update: data,
        create: { merchantId, ...data },
      });
      await this.audit.log(
        adminId,
        AUDIT_ACTIONS.MERCHANT_SUBSCRIPTION,
        'MERCHANT',
        merchantId,
        {
          plan: subscription.plan,
          dailyGenerationLimit: subscription.dailyGenerationLimit,
          monthlyGenerationLimit: subscription.monthlyGenerationLimit,
          expiresAt: subscription.expiresAt?.toISOString() ?? null,
        },
        tx,
      );
      return subscription;
    });
  }

  async updateUser(adminId: string, userId: string, dto: UpdateAdminUserDto) {
    if (dto.email) {
      const duplicate = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
      if (duplicate && duplicate.id !== userId) throw new ConflictException('该邮箱已被使用');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) throw new NotFoundException('用户不存在');

        const updated = await tx.user.update({
          where: { id: userId },
          data: dto,
          select: {
            id: true,
            email: true,
            name: true,
            platformRole: true,
            status: true,
            mustChangePassword: true,
            createdAt: true,
          },
        });
        await this.audit.log(
          adminId,
          AUDIT_ACTIONS.USER_UPDATE,
          'USER',
          userId,
          { changes: dto as Prisma.InputJsonObject },
          tx,
        );
        return updated;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('该邮箱已被使用');
      }
      throw error;
    }
  }

  updateUserStatus(adminId: string, userId: string, dto: UpdateUserStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, platformRole: true, status: true },
      });
      if (!user) throw new NotFoundException('用户不存在');
      this.ensureNotAdmin(user.platformRole);

      const updated = await tx.user.update({ where: { id: userId }, data: { status: dto.status } });
      await this.audit.log(
        adminId,
        AUDIT_ACTIONS.USER_STATUS,
        'USER',
        userId,
        { previousStatus: user.status, status: dto.status },
        tx,
      );
      return updated;
    });
  }

  async resetUserPassword(adminId: string, userId: string) {
    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, platformRole: true },
      });
      if (!user) throw new NotFoundException('用户不存在');
      this.ensureNotAdmin(user.platformRole);

      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: true },
      });
      await this.audit.log(
        adminId,
        AUDIT_ACTIONS.USER_RESET_PASSWORD,
        'USER',
        userId,
        { mustChangePassword: true },
        tx,
      );
    });

    return { temporaryPassword };
  }

  listAuditLogs(page = 1, pageSize = 20, targetType?: string, action?: string) {
    return this.audit.list(page, pageSize, targetType, action);
  }

  async runDailyTasks(adminId: string) {
    const result = await this.dailyTasks.generateForAllMerchants();
    await this.audit.log(adminId, AUDIT_ACTIONS.DAILY_TASKS_RUN, 'JOB', 'daily-tasks', result);
    return result;
  }

  private ensureNotAdmin(platformRole: PlatformRole) {
    if (platformRole === PlatformRole.ADMIN) {
      throw new BadRequestException('禁止对平台管理员执行此操作');
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join('');
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
