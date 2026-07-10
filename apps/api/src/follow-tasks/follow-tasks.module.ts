import { Module } from '@nestjs/common';
import { FollowTasksController } from './follow-tasks.controller';
import { FollowTasksService } from './follow-tasks.service';

@Module({
  controllers: [FollowTasksController],
  providers: [FollowTasksService],
  exports: [FollowTasksService],
})
export class FollowTasksModule {}
