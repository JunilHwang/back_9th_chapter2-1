import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'])
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

  @IsOptional()
  @IsEnum(['name', 'price', 'createdAt'])
  sortBy?: 'name' | 'price' | 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class GetProductDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  productId: number;
}

export class GetPopularProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(30)
  days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  top?: number;
}
