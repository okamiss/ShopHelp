import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { COPYWRITING_SCENARIOS, INDUSTRIES, PLANS, REPLY_SCENARIOS } from '@shophelp/shared';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('meta')
@Controller('meta')
export class MetaController {
  @Public()
  @Get('industries')
  @ApiOperation({ summary: '预置行业列表' })
  industries() {
    return INDUSTRIES;
  }

  @Public()
  @Get('scenarios')
  @ApiOperation({ summary: 'AI 场景列表（文案 + 回复）' })
  scenarios() {
    return { copywriting: COPYWRITING_SCENARIOS, reply: REPLY_SCENARIOS };
  }

  @Public()
  @Get('plans')
  @ApiOperation({ summary: '套餐定义' })
  plans() {
    return PLANS;
  }
}
