import { Balance, BalanceTransaction, User } from '../entities';

export abstract class UserRepository {
  abstract findById(id: number): Promise<User | null>;

  abstract findByEmail(email: string): Promise<User | null>;

  abstract save(user: User): Promise<User>;

  abstract create(userData: Partial<User>): Promise<User>;

  abstract delete(id: number): Promise<void>;
}

export abstract class BalanceRepository {
  abstract findByUserId(userId: number): Promise<Balance | null>;

  abstract save(balance: Balance): Promise<Balance>;

  abstract create(balanceData: Partial<Balance>): Promise<Balance>;

  abstract updateBalance(userId: number, amount: number): Promise<Balance>;

  abstract updateDailyChargeAmount(
    userId: number,
    amount: number,
  ): Promise<Balance>;

  abstract resetDailyChargeAmount(userId: number): Promise<Balance>;
}

export abstract class BalanceTransactionRepository {
  abstract findByUserId(
    userId: number,
    limit?: number,
  ): Promise<BalanceTransaction[]>;

  abstract save(transaction: BalanceTransaction): Promise<BalanceTransaction>;

  abstract create(
    transactionData: Partial<BalanceTransaction>,
  ): Promise<BalanceTransaction>;

  abstract findByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<BalanceTransaction[]>;
}
