import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DailyTasksService } from './daily-tasks.service';

export const DAILY_TASKS_QUEUE = 'daily-tasks';

@Processor(DAILY_TASKS_QUEUE)
export class DailyTasksProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyTasksProcessor.name);

  constructor(private readonly dailyTasks: DailyTasksService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`执行每日待办生成 job=${job.name}`);
    return this.dailyTasks.generateForAllMerchants();
  }
}
