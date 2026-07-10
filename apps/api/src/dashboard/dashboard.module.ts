import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AiModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
