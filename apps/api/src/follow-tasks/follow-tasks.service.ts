import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowTaskDto, QueryFollowTasksDto, UpdateFollowTaskDto } from './dto/follow-task.dto';

const taskSelect = {
  id: true,
  title: true,
  note: true,
  dueDate: true,
  status: true,
  source: true,
  createdAt: true,
  customer: { select: { id: true, name: true, intentLevel: true, status: true } },
} satisfies Prisma.FollowTaskSelect;

@Injectable()
export class FollowTasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(merchantId: string, query: QueryFollowTasksDto) {
    const { status, date, page = 1, pageSize = 20 } = query;
    const where: Prisma.FollowTaskWhereInput = {
      merchantId,
      ...(status && { status }),
      ...(date && { dueDate: new Date(date) }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.followTask.findMany({
        where,
        select: taskSelect,
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.followTask.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(merchantId: string, userId: string, dto: CreateFollowTaskDto) {
    if (dto.customerId) await this.assertCustomer(merchantId, dto.customerId);
    return this.prisma.followTask.create({
      data: {
        merchantId,
        title: dto.title,
        note: dto.note,
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        createdById: userId,
      },
      select: taskSelect,
    });
  }

  async update(merchantId: string, taskId: string, dto: UpdateFollowTaskDto) {
    await this.mustExist(merchantId, taskId);
    if (dto.customerId) await this.assertCustomer(merchantId, dto.customerId);
    const { dueDate, ...data } = dto;
    return this.prisma.followTask.update({
      where: { id: taskId },
      data: { ...data, ...(dueDate && { dueDate: new Date(dueDate) }) },
      select: taskSelect,
    });
  }

  async remove(merchantId: string, taskId: string) {
    await this.mustExist(merchantId, taskId);
    await this.prisma.followTask.delete({ where: { id: taskId } });
    return { ok: true };
  }

  private async mustExist(merchantId: string, taskId: string) {
    const found = await this.prisma.followTask.findFirst({
      where: { id: taskId, merchantId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('任务不存在');
  }

  private async assertCustomer(merchantId: string, customerId: string) {
    const found = await this.prisma.customer.findFirst({
      where: { id: customerId, merchantId },
      select: { id: true },
    });
    if (!found) throw new BadRequestException('关联客户不存在');
  }
}
