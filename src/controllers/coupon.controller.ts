import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CouponUseCase, IssueCouponRequest } from '../use-cases';
import { CouponFilter } from '../repositories';

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

@Controller('api/v1/coupons')
export class CouponController {
  constructor(private readonly couponUseCase: CouponUseCase) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  async issueCoupon(
    @Body() request: IssueCouponRequest,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.couponUseCase.issueCoupon(request);
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
          details: this.getErrorDetails(error, request),
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  @Get()
  async getCoupons(
    @Query('userId') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const filter: CouponFilter = {
        status: status as any,
        page: page ? Number(page) : undefined,
        size: size ? Number(size) : undefined,
      };

      const result = await this.couponUseCase.getCoupons(
        Number(userId),
        filter,
      );
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
          details: { userId: Number(userId) },
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  private getErrorCode(error: any): string {
    if (error.message.includes('쿠폰 이벤트를 찾을 수 없습니다')) {
      return 'COUPON_NOT_FOUND';
    }
    if (error.message.includes('선착순 쿠폰이 모두 소진되었습니다')) {
      return 'COUPON_EXHAUSTED';
    }
    if (error.message.includes('이미 발급받은 쿠폰입니다')) {
      return 'COUPON_ALREADY_USED';
    }
    if (
      error.message.includes('발급 기간이 아닙니다') ||
      error.message.includes('발급 기간이 만료되었습니다')
    ) {
      return 'COUPON_EXPIRED';
    }
    if (error.message.includes('사용자를 찾을 수 없습니다')) {
      return 'USER_NOT_FOUND';
    }
    return 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusCode(error: any): number {
    if (error.message.includes('찾을 수 없습니다')) {
      return HttpStatus.NOT_FOUND;
    }
    if (error.message.includes('소진되었습니다')) {
      return HttpStatus.CONFLICT;
    }
    if (
      error.message.includes('이미 발급받은') ||
      error.message.includes('발급 기간') ||
      error.message.includes('만료')
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(error: any, request?: IssueCouponRequest): any {
    if (error.message.includes('소진되었습니다')) {
      return {
        couponEventId: request?.couponEventId || 0,
        totalQuantity: 100, // This would be calculated in real implementation
        issuedQuantity: 100, // This would be calculated in real implementation
      };
    }
    if (error.message.includes('이미 발급받은')) {
      return {
        userId: request?.userId || 0,
        couponEventId: request?.couponEventId || 0,
      };
    }
    return request || {};
  }
}
