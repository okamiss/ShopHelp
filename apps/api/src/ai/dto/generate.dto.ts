import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenerationType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { COPYWRITING_SCENARIOS, REPLY_SCENARIOS } from '@shophelp/shared';

const COPYWRITING_KEYS = COPYWRITING_SCENARIOS.map((s) => s.key);
const REPLY_KEYS = REPLY_SCENARIOS.map((s) => s.key);

export class GenerateCopywritingDto {
  @ApiProperty({ enum: COPYWRITING_KEYS, example: 'moments' })
  @IsIn(COPYWRITING_KEYS, { message: '无效的文案场景' })
  scenario: string;

  @ApiPropertyOptional({ example: '本周新款日式手绘上新，想发朋友圈' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  input?: string;

  @ApiPropertyOptional({ description: '关联产品 id（生成时带入产品卖点）' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: '关联客户 id（生成时带入客户档案）' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class GenerateReplyDto {
  @ApiProperty({ enum: REPLY_KEYS, example: 'too_expensive' })
  @IsIn(REPLY_KEYS, { message: '无效的回复场景' })
  scenario: string;

  @ApiProperty({ example: '客户说：这也太贵了吧，别家才 99', description: '客户原话或情境描述' })
  @IsString()
  @IsNotEmpty({ message: '请描述客户说了什么' })
  @MaxLength(500)
  input: string;

  @ApiPropertyOptional({ description: '关联产品 id' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: '关联客户 id' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class GenerateFollowUpDto {
  @ApiProperty({ description: '客户 id' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ example: '想约她这周末到店' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  input?: string;
}

export class QueryGenerationsDto {
  @ApiPropertyOptional({ enum: GenerationType })
  @IsOptional()
  @IsIn(Object.values(GenerationType))
  type?: GenerationType;

  @ApiPropertyOptional({ description: '场景 key' })
  @IsOptional()
  @IsString()
  scenario?: string;

  @ApiPropertyOptional({ description: '只看收藏' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  favorite?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;
}

export class FavoriteDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isFavorite: boolean;
}
