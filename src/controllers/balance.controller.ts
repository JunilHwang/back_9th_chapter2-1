import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  HttpException,
  HttpCode,
} from '@nestjs/common';
import { BalanceUseCase, ChargeBalanceRequest } from '../use-cases';

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

@Controller('api/v1/balances')
export class BalanceController {
  constructor(private readonly balanceUseCase: BalanceUseCase) {}

  @Post('charge')
  @HttpCode(HttpStatus.OK)
  async chargeBalance(
    @Body() request: ChargeBalanceRequest,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.balanceUseCase.chargeBalance(request);
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

  @Get(':userId')
  async getBalance(
    @Param('userId') userId: string,
  ): Promise<SuccessResponse<any>> {
    try {
      const result = await this.balanceUseCase.getBalance(Number(userId));
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
    if (error.message.includes('사용자를 찾을 수 없습니다')) {
      return 'USER_NOT_FOUND';
    }
    if (error.message.includes('일일 충전 한도')) {
      return 'DAILY_CHARGE_LIMIT_EXCEEDED';
    }
    if (error.message.includes('최대 보유 한도')) {
      return 'MAX_BALANCE_LIMIT_EXCEEDED';
    }
    if (error.message.includes('충전 금액')) {
      return 'INVALID_PARAMETER';
    }
    return 'INTERNAL_SERVER_ERROR';
  }

  private getHttpStatusCode(error: any): number {
    if (error.message.includes('사용자를 찾을 수 없습니다')) {
      return HttpStatus.NOT_FOUND;
    }
    if (error.message.includes('한도') || error.message.includes('충전 금액')) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(error: any, request: ChargeBalanceRequest): any {
    if (error.message.includes('일일 충전 한도')) {
      return {
        dailyLimit: 1000000,
        currentDailyCharged: 0, // This would be calculated in real implementation
        attemptedAmount: request.amount,
      };
    }
    if (error.message.includes('최대 보유 한도')) {
      return {
        maxBalanceLimit: 10000000,
        currentBalance: 0, // This would be calculated in real implementation
        attemptedAmount: request.amount,
      };
    }
    return { userId: request.userId, amount: request.amount };
  }
}
