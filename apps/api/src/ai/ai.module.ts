import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GenerationsService } from './generations.service';
import { DeepSeekProvider } from './llm/deepseek.provider';
import { LlmService } from './llm/llm.service';
import { MockProvider } from './llm/mock.provider';
import { QuotaGuard } from './quota.guard';
import { UsageService } from './usage.service';

@Module({
  controllers: [AiController],
  providers: [LlmService, DeepSeekProvider, MockProvider, GenerationsService, UsageService, QuotaGuard],
  exports: [LlmService, UsageService, GenerationsService],
})
export class AiModule {}
