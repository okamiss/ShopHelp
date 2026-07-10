import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberRole, PlanType } from '@prisma/client';
import { PLANS } from '@shophelp/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AddMemberDto, CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /** 创建商家：创建者自动成为 OWNER，默认开通 FREE 套餐 */
  async create(ownerId: string, dto: CreateMerchantDto) {
    const free = PLANS[PlanType.FREE];
    return this.prisma.merchant.create({
      data: {
        ...dto,
        ownerId,
        members: { create: { userId: ownerId, role: MemberRole.OWNER } },
        subscription: {
          create: {
            plan: PlanType.FREE,
            dailyGenerationLimit: free.dailyGenerationLimit,
            monthlyGenerationLimit: free.monthlyGenerationLimit,
          },
        },
      },
      include: { subscription: true },
    });
  }

  async findOne(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        subscription: true,
        _count: { select: { customers: true, products: true, members: true } },
      },
    });
    if (!merchant) throw new NotFoundException('商家不存在');
    return merchant;
  }

  update(merchantId: string, dto: UpdateMerchantDto) {
    return this.prisma.merchant.update({ where: { id: merchantId }, data: dto });
  }

  listMembers(merchantId: string) {
    return this.prisma.merchantMember.findMany({
      where: { merchantId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(merchantId: string, dto: AddMemberDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new NotFoundException('该邮箱尚未注册，请先让成员注册账号');

    const exists = await this.prisma.merchantMember.findUnique({
      where: { merchantId_userId: { merchantId, userId: user.id } },
    });
    if (exists) throw new ConflictException('该用户已是商家成员');

    const subscription = await this.prisma.subscription.findUnique({ where: { merchantId } });
    const memberLimit = PLANS[subscription?.plan ?? PlanType.FREE].memberLimit;
    const memberCount = await this.prisma.merchantMember.count({ where: { merchantId } });
    if (memberCount >= memberLimit) {
      throw new BadRequestException(`当前套餐最多 ${memberLimit} 名成员，请升级套餐`);
    }

    return this.prisma.merchantMember.create({
      data: { merchantId, userId: user.id, role: dto.role ?? MemberRole.STAFF },
      select: { id: true, role: true, user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(merchantId: string, memberId: string) {
    const member = await this.prisma.merchantMember.findFirst({ where: { id: memberId, merchantId } });
    if (!member) throw new NotFoundException('成员不存在');
    if (member.role === MemberRole.OWNER) throw new BadRequestException('不能移除商家老板');
    await this.prisma.merchantMember.delete({ where: { id: memberId } });
    return { ok: true };
  }
}
