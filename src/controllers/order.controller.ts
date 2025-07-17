import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateOrderRequest,
  OrderUseCase,
  ProcessPaymentRequest,
} from '../use-cases';
import { OrderFilter } from '../repositories';

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

@Controller('api/v1')
export class OrderController {
  constructor(private readonly orderUseCase: OrderUseCase) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() request: CreateOrderRequest,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.orderUseCase.createOrder(request);
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

  @Post('orders/:orderId/payment')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('orderId') orderId: string,
    @Body() request: ProcessPaymentRequest,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.orderUseCase.processPayment(
        Number(orderId),
        request,
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
          details: this.getErrorDetails(error, {
            orderId: Number(orderId),
            ...request,
          }),
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  @Get('orders/:orderId')
  async getOrder(
    @Param('orderId') orderId: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.orderUseCase.getOrder(Number(orderId));
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
          details: { orderId: Number(orderId) },
        },
        timestamp: Date.now(),
      };

      const statusCode = this.getHttpStatusCode(error);
      throw new HttpException(errorResponse, statusCode);
    }
  }

  @Get('users/:userId/orders')
  async getUserOrders(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const filter: OrderFilter = {
        page: page ? Number(page) : undefined,
        size: size ? Number(size) : undefined,
        status: status as any,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const result = await this.orderUseCase.getUserOrders(
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
    if (error.message.includes('주문을 찾을 수 없습니다')) {
      return 'ORDER_NOT_FOUND';
    }
    if (error.message.includes('재고가 부족합니다')) {
      return 'OUT_OF_STOCK';
    }
    if (error.message.includes('잔액이 부족합니다')) {
      return 'INSUFFICIENT_BALANCE';
    }
    if (error.message.includes('이미 처리된 주문')) {
      return 'ORDER_ALREADY_PAID';
    }
    if (error.message.includes('주문 소유자가 아닙니다')) {
      return 'ORDER_AMOUNT_MISMATCH';
    }
    if (error.message.includes('상품을 찾을 수 없습니다')) {
      return 'PRODUCT_NOT_FOUND';
    }
    if (error.message.includes('사용자를 찾을 수 없습니다')) {
      return 'USER_NOT_FOUND';
    }
    if (error.message.includes('쿠폰')) {
      return 'COUPON_NOT_FOUND';
    }
    return 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusCode(error: any): number {
    if (error.message.includes('찾을 수 없습니다')) {
      return HttpStatus.NOT_FOUND;
    }
    if (
      error.message.includes('재고가 부족') ||
      error.message.includes('잔액이 부족') ||
      error.message.includes('이미 처리된') ||
      error.message.includes('소유자가 아닙니다') ||
      error.message.includes('상품이 없습니다')
    ) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(error: any, params?: any): any {
    if (error.message.includes('재고가 부족')) {
      return {
        productId: params?.items?.[0]?.productId || 0,
        requestedQuantity: params?.items?.[0]?.quantity || 0,
        availableStock: 0, // This would be calculated in real implementation
      };
    }
    if (error.message.includes('잔액이 부족')) {
      return {
        currentBalance: 0, // This would be calculated in real implementation
        requiredAmount: 0, // This would be calculated in real implementation
        shortfall: 0, // This would be calculated in real implementation
      };
    }
    return params || {};
  }
}
