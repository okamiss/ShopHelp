import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: '日式手绘美甲' })
  @IsString()
  @IsNotEmpty({ message: '请填写产品/服务名称' })
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ example: '美甲' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;

  @ApiPropertyOptional({ example: 198, description: '价格（元）' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: '次' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @ApiPropertyOptional({ example: '进口甲油胶，款式每月上新' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '进口材料不伤甲\n维持 4-6 周', description: '卖点，换行分隔' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sellingPoints?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ON })
  @IsOptional()
  @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
