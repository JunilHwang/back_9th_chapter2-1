import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class IssueCouponDto {
  @IsNumber()
  @Min(1)
  userId: number;

  @IsNumber()
  @Min(1)
  couponEventId: number;
}

export class GetCouponsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsEnum(['AVAILABLE', 'USED', 'EXPIRED'])
  status?: 'AVAILABLE' | 'USED' | 'EXPIRED';

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
}
