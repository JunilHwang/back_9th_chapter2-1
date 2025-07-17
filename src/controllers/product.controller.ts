import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ProductUseCase } from '../use-cases';
import { PopularProductFilter, ProductFilter } from '../repositories';

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: number;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

@Controller('api/v1/products')
export class ProductController {
  constructor(private readonly productUseCase: ProductUseCase) {}

  @Get()
  async getProducts(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const filter: ProductFilter = {
        page: page ? Number(page) : undefined,
        size: size ? Number(size) : undefined,
        status: status as any,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const result = await this.productUseCase.getProducts(filter);
      return {
        success: true,
        data: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorCode = this.getErrorCode(error);
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: error.message,
          details: this.getErrorDetails(error),
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  @Get('popular')
  async getPopularProducts(
    @Query('days') days?: string,
    @Query('top') top?: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const filter: PopularProductFilter = {
        days: days ? Number(days) : undefined,
        top: top ? Number(top) : undefined,
      };

      const result = await this.productUseCase.getPopularProducts(filter);
      return {
        success: true,
        data: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorCode = this.getErrorCode(error);
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: error.message,
          details: this.getErrorDetails(error, { days, top }),
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  @Get(':productId')
  async getProduct(
    @Param('productId') productId: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.productUseCase.getProduct(Number(productId));
      return {
        success: true,
        data: result,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorCode = this.getErrorCode(error);
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: errorCode,
          message: error.message,
          details: { productId: Number(productId) },
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  private getErrorCode(error: any): string {
    if (error.message.includes('상품을 찾을 수 없습니다')) {
      return 'PRODUCT_NOT_FOUND';
    }
    if (
      error.message.includes('페이지') ||
      error.message.includes('조회 일수') ||
      error.message.includes('상품 개수')
    ) {
      return 'INVALID_PARAMETER';
    }
    return 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusCode(error: any): number {
    if (error.message.includes('상품을 찾을 수 없습니다')) {
      return HttpStatus.NOT_FOUND;
    }
    if (
      error.message.includes('페이지') ||
      error.message.includes('조회 일수') ||
      error.message.includes('상품 개수')
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(error: any, params?: any): any {
    if (error.message.includes('조회 일수')) {
      return {
        field: 'days',
        value: params?.days,
        allowedRange: '1-30',
      };
    }
    if (error.message.includes('상품 개수')) {
      return {
        field: 'top',
        value: params?.top,
        allowedRange: '1-50',
      };
    }
    return params || {};
  }
}
