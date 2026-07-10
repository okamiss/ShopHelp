import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CustomerStatus, IntentLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: '李小姐' })
  @IsString()
  @IsNotEmpty({ message: '请填写客户姓名' })
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ example: 'lixiaojie88' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  wechat?: string;

  @ApiPropertyOptional({ example: '139-1111-2222' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: '朋友圈' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @ApiPropertyOptional({ enum: IntentLevel, default: IntentLevel.C })
  @IsOptional()
  @IsIn(Object.values(IntentLevel))
  intentLevel?: IntentLevel;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.UNCONTACTED })
  @IsOptional()
  @IsIn(Object.values(CustomerStatus))
  status?: CustomerStatus;

  @ApiPropertyOptional({ example: '看中季卡，在对比别家' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ example: '2026-07-15T10:00:00.000Z', description: '下次跟进时间' })
  @IsOptional()
  @IsDateString()
  nextFollowAt?: string;

  @ApiPropertyOptional({ type: [String], description: '标签 id 列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: '分配给的成员用户 id（预留）' })
  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class QueryCustomersDto {
  @ApiPropertyOptional({ description: '按姓名/微信/手机模糊搜索' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string;

  @ApiPropertyOptional({ enum: IntentLevel })
  @IsOptional()
  @IsIn(Object.values(IntentLevel))
  intentLevel?: IntentLevel;

  @ApiPropertyOptional({ enum: CustomerStatus })
  @IsOptional()
  @IsIn(Object.values(CustomerStatus))
  status?: CustomerStatus;

  @ApiPropertyOptional({ description: '标签 id' })
  @IsOptional()
  @IsString()
  tagId?: string;

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

export class CreateNoteDto {
  @ApiProperty({ example: '今天回访，说月底发工资再定' })
  @IsString()
  @IsNotEmpty({ message: '请填写跟进内容' })
  @MaxLength(1000)
  content: string;
}

export class CreateTagDto {
  @ApiProperty({ example: '老客户' })
  @IsString()
  @IsNotEmpty({ message: '请填写标签名' })
  @MaxLength(16)
  name: string;

  @ApiPropertyOptional({ example: 'gold' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}
