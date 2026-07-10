import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MerchantGuard } from '../common/guards/merchant.guard';
import type { AuthUser } from '../common/types/request-context';
import { CreateFollowTaskDto, QueryFollowTasksDto, UpdateFollowTaskDto } from './dto/follow-task.dto';
import { FollowTasksService } from './follow-tasks.service';

@ApiTags('follow-tasks')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchants/:merchantId/follow-tasks')
export class FollowTasksController {
  constructor(private readonly tasks: FollowTasksService) {}

  @Get()
  @ApiOperation({ summary: '跟进任务列表' })
  list(@Param('merchantId') merchantId: string, @Query() query: QueryFollowTasksDto) {
    return this.tasks.list(merchantId, query);
  }

  @Post()
  @ApiOperation({ summary: '新建跟进任务' })
  create(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFollowTaskDto,
  ) {
    return this.tasks.create(merchantId, user.sub, dto);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: '更新任务（含完成/跳过）' })
  update(
    @Param('merchantId') merchantId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateFollowTaskDto,
  ) {
    return this.tasks.update(merchantId, taskId, dto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: '删除任务' })
  remove(@Param('merchantId') merchantId: string, @Param('taskId') taskId: string) {
    return this.tasks.remove(merchantId, taskId);
  }
}
