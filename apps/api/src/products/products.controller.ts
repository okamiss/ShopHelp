import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantGuard } from '../common/guards/merchant.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchants/:merchantId/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '产品/服务列表' })
  list(@Param('merchantId') merchantId: string) {
    return this.products.list(merchantId);
  }

  @Post()
  @ApiOperation({ summary: '新增产品/服务' })
  create(@Param('merchantId') merchantId: string, @Body() dto: CreateProductDto) {
    return this.products.create(merchantId, dto);
  }

  @Patch(':productId')
  @ApiOperation({ summary: '更新产品/服务' })
  update(
    @Param('merchantId') merchantId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(merchantId, productId, dto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: '删除产品/服务' })
  remove(@Param('merchantId') merchantId: string, @Param('productId') productId: string) {
    return this.products.remove(merchantId, productId);
  }
}
