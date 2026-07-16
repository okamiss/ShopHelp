import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';

@Module({
  imports: [JobsModule],
  controllers: [AdminController],
  providers: [AdminService, AuditService],
})
export class AdminModule {}
