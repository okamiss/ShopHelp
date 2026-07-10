import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(merchantId: string) {
    return this.prisma.product.findMany({
      where: { merchantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(merchantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { merchantId, ...dto } });
  }

  async update(merchantId: string, productId: string, dto: UpdateProductDto) {
    await this.mustExist(merchantId, productId);
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async remove(merchantId: string, productId: string) {
    await this.mustExist(merchantId, productId);
    await this.prisma.product.delete({ where: { id: productId } });
    return { ok: true };
  }

  private async mustExist(merchantId: string, productId: string) {
    const found = await this.prisma.product.findFirst({
      where: { id: productId, merchantId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('产品不存在');
  }
}
