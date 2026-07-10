import { InjectQueue, BullModule } from '@nestjs/bullmq';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { DAILY_TASKS_QUEUE, DailyTasksProcessor } from './daily-tasks.processor';
import { DailyTasksService } from './daily-tasks.service';

@Module({
  imports: [BullModule.registerQueue({ name: DAILY_TASKS_QUEUE })],
  providers: [DailyTasksService, DailyTasksProcessor],
  exports: [DailyTasksService],
})
export class JobsModule implements OnModuleInit {
  private readonly logger = new Logger(JobsModule.name);

  constructor(@InjectQueue(DAILY_TASKS_QUEUE) private readonly queue: Queue) {}

  /** 注册每天 06:00 的重复任务（幂等） */
  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'daily-tasks-cron',
      { pattern: '0 6 * * *', tz: 'Asia/Shanghai' },
      { name: 'generate-daily-tasks' },
    );
    this.logger.log('已注册每日 06:00 待办生成任务');
  }
}
