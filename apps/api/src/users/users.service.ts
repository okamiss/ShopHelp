import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findStatusById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });
  }

  create(data: { email: string; passwordHash: string; name: string }) {
    return this.prisma.user.create({ data });
  }

  updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  /** 用户所属的商家成员关系（带商家概要） */
  membershipsOf(userId: string) {
    return this.prisma.merchantMember.findMany({
      where: { userId },
      select: {
        role: true,
        merchant: { select: { id: true, name: true, industry: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
