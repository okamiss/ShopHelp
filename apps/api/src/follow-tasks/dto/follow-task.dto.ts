import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FollowTaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateFollowTaskDto {
  @ApiProperty({ example: '跟进李小姐季卡意向' })
  @IsString()
  @IsNotEmpty({ message: '请填写任务标题' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '关联客户 id' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: '2026-07-15', description: '到期日期' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: '发限时优惠给她' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateFollowTaskDto extends PartialType(CreateFollowTaskDto) {
  @ApiPropertyOptional({ enum: FollowTaskStatus })
  @IsOptional()
  @IsIn(Object.values(FollowTaskStatus))
  status?: FollowTaskStatus;
}

export class QueryFollowTasksDto {
  @ApiPropertyOptional({ enum: FollowTaskStatus })
  @IsOptional()
  @IsIn(Object.values(FollowTaskStatus))
  status?: FollowTaskStatus;

  @ApiPropertyOptional({ description: '只看某天（YYYY-MM-DD）' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
