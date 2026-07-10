import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { INDUSTRIES } from '@shophelp/shared';

const INDUSTRY_KEYS = INDUSTRIES.map((i) => i.key);

export class CreateMerchantDto {
  @ApiProperty({ example: '悦颜美甲工作室' })
  @IsString()
  @IsNotEmpty({ message: '请填写商家名称' })
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: 'nail_lash', enum: INDUSTRY_KEYS })
  @IsIn(INDUSTRY_KEYS, { message: '行业不在预置列表中' })
  industry: string;

  @ApiPropertyOptional({ example: '社区型美甲美睫工作室' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '幸福路 88 号 2 楼' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: '138-0000-0000' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ example: '10:00 - 21:00（周一店休）' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessHours?: string;

  @ApiPropertyOptional({ example: '亲切自然，像闺蜜聊天' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  brandTone?: string;

  @ApiPropertyOptional({ example: '25-40 岁女性，注重生活品质' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetCustomers?: string;
}

export class UpdateMerchantDto extends PartialType(CreateMerchantDto) {}

export class AddMemberDto {
  @ApiProperty({ example: 'staff@example.com', description: '受邀成员需已注册' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.STAFF })
  @IsOptional()
  @IsIn(Object.values(MemberRole))
  role?: MemberRole;
}
