import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuditDb = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(
    adminId: string | null,
    action: string,
    targetType: string,
    targetId: string,
    detail?: Prisma.InputJsonValue,
    db: AuditDb = this.prisma,
  ) {
    return db.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        ...(detail !== undefined ? { detail } : {}),
      },
    });
  }

  async list(page = 1, pageSize = 20, targetType?: string, action?: string) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(100, Math.max(1, pageSize));
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(targetType ? { targetType } : {}),
      ...(action ? { action } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          detail: true,
          createdAt: true,
          admin: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);
    return { items, total, page: safePage, pageSize: safePageSize };
  }
}
