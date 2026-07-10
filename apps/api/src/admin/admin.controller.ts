import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { DailyTasksService } from '../jobs/daily-tasks.service';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly dailyTasks: DailyTasksService,
  ) {}

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

  @Get('usage-trend')
  @ApiOperation({ summary: '平台用量趋势（近 N 天）' })
  usageTrend(@Query('days') days = 14) {
    return this.admin.usageTrend(Number(days));
  }

  @Post('jobs/daily-tasks/run')
  @ApiOperation({ summary: '手动触发每日待办生成任务（测试用）' })
  runDailyTasks() {
    return this.dailyTasks.generateForAllMerchants();
  }
}
