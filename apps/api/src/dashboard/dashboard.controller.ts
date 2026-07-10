import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantGuard } from '../common/guards/merchant.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(MerchantGuard)
@Controller('merchants/:merchantId/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard 聚合数据（待办/待跟进/高意向/建议/最近生成/用量）' })
  summary(@Param('merchantId') merchantId: string) {
    return this.dashboard.summary(merchantId);
  }
}
