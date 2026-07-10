import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MerchantGuard } from '../common/guards/merchant.guard';
import type { AuthUser } from '../common/types/request-context';
import {
  CreateCustomerDto,
  CreateNoteDto,
  CreateTagDto,
  QueryCustomersDto,
  UpdateCustomerDto,
} from './dto/customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchants/:merchantId')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get('customers')
  @ApiOperation({ summary: '客户列表（筛选 + 分页）' })
  list(@Param('merchantId') merchantId: string, @Query() query: QueryCustomersDto) {
    return this.customers.list(merchantId, query);
  }

  @Post('customers')
  @ApiOperation({ summary: '新增客户' })
  create(@Param('merchantId') merchantId: string, @Body() dto: CreateCustomerDto) {
    return this.customers.create(merchantId, dto);
  }

  @Get('customers/:customerId')
  @ApiOperation({ summary: '客户详情（含标签/跟进记录/任务/AI 记录）' })
  findOne(@Param('merchantId') merchantId: string, @Param('customerId') customerId: string) {
    return this.customers.findOne(merchantId, customerId);
  }

  @Patch('customers/:customerId')
  @ApiOperation({ summary: '更新客户' })
  update(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(merchantId, customerId, dto);
  }

  @Delete('customers/:customerId')
  @ApiOperation({ summary: '删除客户' })
  remove(@Param('merchantId') merchantId: string, @Param('customerId') customerId: string) {
    return this.customers.remove(merchantId, customerId);
  }

  @Post('customers/:customerId/notes')
  @ApiOperation({ summary: '添加跟进记录（自动更新最近联系时间）' })
  addNote(
    @Param('merchantId') merchantId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateNoteDto,
  ) {
    return this.customers.addNote(merchantId, customerId, user.sub, dto);
  }

  @Get('tags')
  @ApiOperation({ summary: '标签列表' })
  listTags(@Param('merchantId') merchantId: string) {
    return this.customers.listTags(merchantId);
  }

  @Post('tags')
  @ApiOperation({ summary: '新建标签' })
  createTag(@Param('merchantId') merchantId: string, @Body() dto: CreateTagDto) {
    return this.customers.createTag(merchantId, dto);
  }

  @Delete('tags/:tagId')
  @ApiOperation({ summary: '删除标签' })
  removeTag(@Param('merchantId') merchantId: string, @Param('tagId') tagId: string) {
    return this.customers.removeTag(merchantId, tagId);
  }
}
