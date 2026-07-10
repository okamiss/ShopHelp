import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MerchantGuard } from '../common/guards/merchant.guard';
import type { AuthUser } from '../common/types/request-context';
import {
  FavoriteDto,
  GenerateCopywritingDto,
  GenerateFollowUpDto,
  GenerateReplyDto,
  QueryGenerationsDto,
} from './dto/generate.dto';
import { GenerationsService } from './generations.service';
import { QuotaGuard } from './quota.guard';
import { UsageService } from './usage.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchants/:merchantId/ai')
export class AiController {
  constructor(
    private readonly generations: GenerationsService,
    private readonly usage: UsageService,
  ) {}

  @Post('copywriting')
  @UseGuards(QuotaGuard)
  @ApiOperation({ summary: 'AI 文案生成（10 场景，3 版本输出）' })
  copywriting(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateCopywritingDto,
  ) {
    return this.generations.generateCopywriting(merchantId, user.sub, dto);
  }

  @Post('reply')
  @UseGuards(QuotaGuard)
  @ApiOperation({ summary: 'AI 客户回复（12 场景，3 版本输出）' })
  reply(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateReplyDto,
  ) {
    return this.generations.generateReply(merchantId, user.sub, dto);
  }

  @Post('follow-up')
  @UseGuards(QuotaGuard)
  @ApiOperation({ summary: 'AI 生成客户下一步跟进话术' })
  followUp(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateFollowUpDto,
  ) {
    return this.generations.generateFollowUp(merchantId, user.sub, dto);
  }

  @Get('generations')
  @ApiOperation({ summary: '生成历史（可筛类型/场景/收藏）' })
  list(@Param('merchantId') merchantId: string, @Query() query: QueryGenerationsDto) {
    return this.generations.list(merchantId, query);
  }

  @Patch('generations/:generationId/favorite')
  @ApiOperation({ summary: '收藏/取消收藏为话术' })
  favorite(
    @Param('merchantId') merchantId: string,
    @Param('generationId') generationId: string,
    @Body() dto: FavoriteDto,
  ) {
    return this.generations.setFavorite(merchantId, generationId, dto.isFavorite);
  }

  @Get('usage')
  @ApiOperation({ summary: '套餐与用量概览' })
  usageSummary(@Param('merchantId') merchantId: string) {
    return this.usage.summary(merchantId);
  }
}
