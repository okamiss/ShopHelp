import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanType, Prisma } from '@prisma/client';
import { PLANS } from '@shophelp/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomerDto,
  CreateNoteDto,
  CreateTagDto,
  QueryCustomersDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

const customerListSelect = {
  id: true,
  name: true,
  wechat: true,
  phone: true,
  source: true,
  intentLevel: true,
  status: true,
  remark: true,
  nextFollowAt: true,
  lastContactAt: true,
  createdAt: true,
  tags: { select: { id: true, name: true, color: true } },
} satisfies Prisma.CustomerSelect;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(merchantId: string, query: QueryCustomersDto) {
    const { keyword, intentLevel, status, tagId, page = 1, pageSize = 20 } = query;
    const where: Prisma.CustomerWhereInput = {
      merchantId,
      ...(intentLevel && { intentLevel }),
      ...(status && { status }),
      ...(tagId && { tags: { some: { id: tagId } } }),
      ...(keyword && {
        OR: [
          { name: { contains: keyword } },
          { wechat: { contains: keyword } },
          { phone: { contains: keyword } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        select: customerListSelect,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(merchantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, merchantId },
      include: {
        tags: { select: { id: true, name: true, color: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            content: true,
            createdAt: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
        followTasks: {
          orderBy: { dueDate: 'desc' },
          take: 20,
          select: { id: true, title: true, dueDate: true, status: true, note: true },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, type: true, scenario: true, output: true, createdAt: true, isFavorite: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('客户不存在');
    return customer;
  }

  async create(merchantId: string, dto: CreateCustomerDto) {
    const subscription = await this.prisma.subscription.findUnique({ where: { merchantId } });
    const limit = PLANS[subscription?.plan ?? PlanType.FREE].customerLimit;
    if (limit > 0) {
      const count = await this.prisma.customer.count({ where: { merchantId } });
      if (count >= limit) {
        throw new BadRequestException(`当前套餐最多 ${limit} 位客户，请升级套餐`);
      }
    }

    const { tagIds, nextFollowAt, ...data } = dto;
    await this.assertTagsBelong(merchantId, tagIds);
    return this.prisma.customer.create({
      data: {
        merchantId,
        ...data,
        nextFollowAt: nextFollowAt ? new Date(nextFollowAt) : undefined,
        ...(tagIds?.length && { tags: { connect: tagIds.map((id) => ({ id })) } }),
      },
      select: customerListSelect,
    });
  }

  async update(merchantId: string, customerId: string, dto: UpdateCustomerDto) {
    await this.mustExist(merchantId, customerId);
    const { tagIds, nextFollowAt, ...data } = dto;
    await this.assertTagsBelong(merchantId, tagIds);
    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...data,
        ...(nextFollowAt !== undefined && { nextFollowAt: nextFollowAt ? new Date(nextFollowAt) : null }),
        ...(tagIds && { tags: { set: tagIds.map((id) => ({ id })) } }),
      },
      select: customerListSelect,
    });
  }

  async remove(merchantId: string, customerId: string) {
    await this.mustExist(merchantId, customerId);
    await this.prisma.customer.delete({ where: { id: customerId } });
    return { ok: true };
  }

  // ---------- 跟进记录 ----------

  async addNote(merchantId: string, customerId: string, userId: string, dto: CreateNoteDto) {
    await this.mustExist(merchantId, customerId);
    const [note] = await this.prisma.$transaction([
      this.prisma.customerNote.create({
        data: { merchantId, customerId, content: dto.content, createdById: userId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.customer.update({
        where: { id: customerId },
        data: { lastContactAt: new Date() },
      }),
    ]);
    return note;
  }

  // ---------- 标签 ----------

  listTags(merchantId: string) {
    return this.prisma.customerTag.findMany({
      where: { merchantId },
      select: { id: true, name: true, color: true, _count: { select: { customers: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTag(merchantId: string, dto: CreateTagDto) {
    const exists = await this.prisma.customerTag.findUnique({
      where: { merchantId_name: { merchantId, name: dto.name } },
    });
    if (exists) throw new ConflictException('标签已存在');
    return this.prisma.customerTag.create({ data: { merchantId, ...dto } });
  }

  async removeTag(merchantId: string, tagId: string) {
    const tag = await this.prisma.customerTag.findFirst({ where: { id: tagId, merchantId } });
    if (!tag) throw new NotFoundException('标签不存在');
    await this.prisma.customerTag.delete({ where: { id: tagId } });
    return { ok: true };
  }

  // ---------- helpers ----------

  private async mustExist(merchantId: string, customerId: string) {
    const found = await this.prisma.customer.findFirst({
      where: { id: customerId, merchantId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('客户不存在');
  }

  private async assertTagsBelong(merchantId: string, tagIds?: string[]) {
    if (!tagIds?.length) return;
    const count = await this.prisma.customerTag.count({ where: { id: { in: tagIds }, merchantId } });
    if (count !== tagIds.length) throw new BadRequestException('包含无效标签');
  }
}
