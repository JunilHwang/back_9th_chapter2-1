import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceRepository,
  BalanceTransactionRepository,
  UserRepository,
} from '../repositories';
import { TransactionType } from '../entities';

export interface ChargeBalanceRequest {
  userId: number;
  amount: number;
}

export interface ChargeBalanceResponse {
  userId: number;
  chargedAmount: number;
  currentBalance: number;
  chargedAt: number;
}

export interface GetBalanceResponse {
  userId: number;
  currentBalance: number;
  dailyChargedAmount: number;
  lastUpdatedAt: number;
}

@Injectable()
export class BalanceUseCase {
  private readonly DAILY_CHARGE_LIMIT = 1000000; // 1,000,000 원
  private readonly MAX_BALANCE_LIMIT = 10000000; // 10,000,000 원

  constructor(
    private readonly userRepository: UserRepository,
    private readonly balanceRepository: BalanceRepository,
    private readonly balanceTransactionRepository: BalanceTransactionRepository,
  ) {}

  async chargeBalance(
    request: ChargeBalanceRequest,
  ): Promise<ChargeBalanceResponse> {
    const { userId, amount } = request;

    // 입력 유효성 검증
    if (amount <= 0) {
      throw new BadRequestException('충전 금액은 0보다 커야 합니다.');
    }

    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 잔액 조회 (없으면 생성)
    let balance = await this.balanceRepository.findByUserId(userId);
    if (!balance) {
      balance = await this.balanceRepository.create({
        userId,
        currentBalance: 0,
        dailyChargeAmount: 0,
        lastUpdatedAt: new Date(),
      });
    }

    // 일일 충전 한도 확인
    if (balance.dailyChargeAmount + amount > this.DAILY_CHARGE_LIMIT) {
      throw new BadRequestException('일일 충전 한도를 초과했습니다.');
    }

    // 최대 보유 한도 확인
    if (balance.currentBalance + amount > this.MAX_BALANCE_LIMIT) {
      throw new BadRequestException('최대 보유 한도를 초과했습니다.');
    }

    // 충전 처리
    const balanceBefore = balance.currentBalance;
    const balanceAfter = balanceBefore + amount;

    // 잔액 업데이트
    balance.currentBalance = balanceAfter;
    balance.dailyChargeAmount += amount;
    balance.lastUpdatedAt = new Date();
    await this.balanceRepository.save(balance);

    // 거래 이력 생성
    await this.balanceTransactionRepository.create({
      userId,
      transactionType: TransactionType.CHARGE,
      amount,
      balanceBefore,
      balanceAfter,
      description: `잔액 충전 ${amount.toLocaleString()}원`,
    });

    return {
      userId,
      chargedAmount: amount,
      currentBalance: balanceAfter,
      chargedAt: new Date().getTime(),
    };
  }

  async getBalance(userId: number): Promise<GetBalanceResponse> {
    // 사용자 존재 확인
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 잔액 조회
    const balance = await this.balanceRepository.findByUserId(userId);
    if (!balance) {
      // 잔액이 없으면 기본 값으로 생성
      const newBalance = await this.balanceRepository.create({
        userId,
        currentBalance: 0,
        dailyChargeAmount: 0,
        lastUpdatedAt: new Date(),
      });

      return {
        userId,
        currentBalance: newBalance.currentBalance,
        dailyChargedAmount: newBalance.dailyChargeAmount,
        lastUpdatedAt: newBalance.lastUpdatedAt.getTime(),
      };
    }

    return {
      userId,
      currentBalance: balance.currentBalance,
      dailyChargedAmount: balance.dailyChargeAmount,
      lastUpdatedAt: balance.lastUpdatedAt.getTime(),
    };
  }

  async deductBalance(
    userId: number,
    amount: number,
    description?: string,
  ): Promise<void> {
    const balance = await this.balanceRepository.findByUserId(userId);
    if (!balance) {
      throw new NotFoundException('잔액 정보를 찾을 수 없습니다.');
    }

    if (balance.currentBalance < amount) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    const balanceBefore = balance.currentBalance;
    const balanceAfter = balanceBefore - amount;

    // 잔액 업데이트
    balance.currentBalance = balanceAfter;
    balance.lastUpdatedAt = new Date();
    await this.balanceRepository.save(balance);

    // 거래 이력 생성
    await this.balanceTransactionRepository.create({
      userId,
      transactionType: TransactionType.USE,
      amount,
      balanceBefore,
      balanceAfter,
      description: description || `잔액 사용 ${amount.toLocaleString()}원`,
    });
  }
}
