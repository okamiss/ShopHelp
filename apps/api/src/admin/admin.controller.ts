import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import type { AuthUser } from '../common/types/request-context';
import { UpdateMerchantDto } from '../merchants/dto/merchant.dto';
import { AdminService } from './admin.service';
import {
  UpdateAdminUserDto,
  UpdateMerchantStatusDto,
  UpdateSubscriptionDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '平台总览统计' })
  stats() {
    return this.admin.stats();
  }

  @Get('merchants')
  @ApiOperation({ summary: '商家列表' })
  merchants(@Query('page') page = 1, @Query('pageSize') pageSize = 20, @Query('keyword') keyword?: string) {
    return this.admin.listMerchants(Number(page), Number(pageSize), keyword);
  }

  @Get('users')
  @ApiOperation({ summary: '用户列表' })
  users(@Query('page') page = 1, @Query('pageSize') pageSize = 20, @Query('keyword') keyword?: string) {
    return this.admin.listUsers(Number(page), Number(pageSize), keyword);
  }

  @Patch('merchants/:id')
  @ApiOperation({ summary: '编辑商家资料' })
  updateMerchant(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMerchantDto) {
    return this.admin.updateMerchant(user.sub, id, dto);
  }

  @Patch('merchants/:id/status')
  @ApiOperation({ summary: '封停或恢复商家' })
  updateMerchantStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMerchantStatusDto,
  ) {
    return this.admin.updateMerchantStatus(user.sub, id, dto);
  }

  @Patch('merchants/:id/subscription')
  @ApiOperation({ summary: '调整商家套餐' })
  updateSubscription(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.admin.updateSubscription(user.sub, id, dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '编辑用户资料' })
  updateUser(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.admin.updateUser(user.sub, id, dto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '禁用或启用用户' })
  updateUserStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.updateUserStatus(user.sub, id, dto);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '重置用户密码并返回一次性临时密码' })
  resetUserPassword(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.resetUserPassword(user.sub, id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: '管理操作审计日志' })
  auditLogs(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('targetType') targetType?: string,
    @Query('action') action?: string,
  ) {
    return this.admin.listAuditLogs(Number(page), Number(pageSize), targetType, action);
  }

  @Get('usage-trend')
  @ApiOperation({ summary: '平台用量趋势（近 N 天）' })
  usageTrend(@Query('days') days = 14) {
    return this.admin.usageTrend(Number(days));
  }

  @Post('jobs/daily-tasks/run')
  @ApiOperation({ summary: '手动触发每日待办生成任务（测试用）' })
  runDailyTasks(@CurrentUser() user: AuthUser) {
    return this.admin.runDailyTasks(user.sub);
  }
}
