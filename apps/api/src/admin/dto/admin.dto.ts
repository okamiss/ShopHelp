import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MerchantStatus, PlanType, UserStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMerchantStatusDto {
  @ApiProperty({ enum: MerchantStatus })
  @IsEnum(MerchantStatus, { message: '商家状态不正确' })
  status: MerchantStatus;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType, { message: '套餐类型不正确' })
  plan: PlanType;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '每日限额必须大于 0' })
  dailyGenerationLimit?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: '每月限额必须大于 0' })
  monthlyGenerationLimit?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: '套餐有效期格式不正确' })
  expiresAt?: string | null;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: '王老板' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  name?: string;

  @ApiPropertyOptional({ example: 'boss@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus, { message: '用户状态不正确' })
  status: UserStatus;
}
