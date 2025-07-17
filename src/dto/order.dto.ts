import {
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  userId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  couponId?: number;
}

export class ProcessPaymentDto {
  @IsNumber()
  @Min(1)
  userId: number;
}

export class GetOrderDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  orderId: number;
}

export class GetUserOrdersDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId: number;

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
  @IsEnum(['PENDING', 'COMPLETED', 'FAILED'])
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';

  @IsOptional()
  @IsEnum(['createdAt', 'finalAmount'])
  sortBy?: 'createdAt' | 'finalAmount';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
