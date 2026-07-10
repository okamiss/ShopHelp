import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MemberRoles } from '../common/decorators/member-roles.decorator';
import { MerchantGuard } from '../common/guards/merchant.guard';
import type { AuthUser } from '../common/types/request-context';
import { AddMemberDto, CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto';
import { MerchantsService } from './merchants.service';

@ApiTags('merchants')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchants: MerchantsService) {}

  @Post()
  @ApiOperation({ summary: '创建商家（创建者成为老板）' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMerchantDto) {
    return this.merchants.create(user.sub, dto);
  }

  @Get(':merchantId')
  @UseGuards(MerchantGuard)
  @ApiOperation({ summary: '商家详情（含套餐与统计）' })
  findOne(@Param('merchantId') merchantId: string) {
    return this.merchants.findOne(merchantId);
  }

  @Patch(':merchantId')
  @UseGuards(MerchantGuard)
  @MemberRoles(MemberRole.OWNER)
  @ApiOperation({ summary: '更新商家资料（仅老板）' })
  update(@Param('merchantId') merchantId: string, @Body() dto: UpdateMerchantDto) {
    return this.merchants.update(merchantId, dto);
  }

  @Get(':merchantId/members')
  @UseGuards(MerchantGuard)
  @ApiOperation({ summary: '成员列表' })
  listMembers(@Param('merchantId') merchantId: string) {
    return this.merchants.listMembers(merchantId);
  }

  @Post(':merchantId/members')
  @UseGuards(MerchantGuard)
  @MemberRoles(MemberRole.OWNER)
  @ApiOperation({ summary: '添加成员（仅老板，按邮箱邀请已注册用户）' })
  addMember(@Param('merchantId') merchantId: string, @Body() dto: AddMemberDto) {
    return this.merchants.addMember(merchantId, dto);
  }

  @Delete(':merchantId/members/:memberId')
  @UseGuards(MerchantGuard)
  @MemberRoles(MemberRole.OWNER)
  @ApiOperation({ summary: '移除成员（仅老板）' })
  removeMember(@Param('merchantId') merchantId: string, @Param('memberId') memberId: string) {
    return this.merchants.removeMember(merchantId, memberId);
  }
}
