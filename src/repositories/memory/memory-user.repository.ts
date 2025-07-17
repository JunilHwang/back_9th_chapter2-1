import { Injectable } from '@nestjs/common';
import {
  BalanceRepository,
  BalanceTransactionRepository,
  UserRepository,
} from '../user.repository';
import {
  Balance,
  BalanceTransaction,
  TransactionType,
  User,
  UserStatus,
} from '../../entities';

@Injectable()
export class MemoryUserRepository extends UserRepository {
  private users: Map<number, User> = new Map();
  private currentId = 1;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const users = [
      {
        id: 1,
        name: '김철수',
        email: 'kim@test.com',
        phone: '010-1234-5678',
        status: UserStatus.ACTIVE,
      },
      {
        id: 2,
        name: '이영희',
        email: 'lee@test.com',
        phone: '010-2345-6789',
        status: UserStatus.ACTIVE,
      },
      {
        id: 3,
        name: '박민수',
        email: 'park@test.com',
        phone: '010-3456-7890',
        status: UserStatus.ACTIVE,
      },
    ];

    users.forEach((userData) => {
      const user = new User();
      Object.assign(user, userData);
      user.createdAt = new Date();
      user.updatedAt = new Date();
      this.users.set(user.id, user);
    });

    this.currentId = Math.max(...users.map((u) => u.id)) + 1;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    user.updatedAt = new Date();
    this.users.set(user.id, user);
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new User();
    Object.assign(user, userData);
    user.id = this.currentId++;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: number): Promise<void> {
    this.users.delete(id);
  }
}

@Injectable()
export class MemoryBalanceRepository extends BalanceRepository {
  private balances: Map<number, Balance> = new Map();
  private currentId = 1;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const balances = [
      { id: 1, userId: 1, currentBalance: 50000, dailyChargeAmount: 0 },
      { id: 2, userId: 2, currentBalance: 100000, dailyChargeAmount: 0 },
      { id: 3, userId: 3, currentBalance: 75000, dailyChargeAmount: 0 },
    ];

    balances.forEach((balanceData) => {
      const balance = new Balance();
      Object.assign(balance, balanceData);
      balance.lastUpdatedAt = new Date();
      balance.createdAt = new Date();
      balance.updatedAt = new Date();
      this.balances.set(balance.id, balance);
    });

    this.currentId = Math.max(...balances.map((b) => b.id)) + 1;
  }

  async findByUserId(userId: number): Promise<Balance | null> {
    for (const balance of this.balances.values()) {
      if (balance.userId === userId) {
        return balance;
      }
    }
    return null;
  }

  async save(balance: Balance): Promise<Balance> {
    balance.lastUpdatedAt = new Date();
    balance.updatedAt = new Date();
    this.balances.set(balance.id, balance);
    return balance;
  }

  async create(balanceData: Partial<Balance>): Promise<Balance> {
    const balance = new Balance();
    Object.assign(balance, balanceData);
    balance.id = this.currentId++;
    balance.lastUpdatedAt = new Date();
    balance.createdAt = new Date();
    balance.updatedAt = new Date();
    this.balances.set(balance.id, balance);
    return balance;
  }

  async updateBalance(userId: number, amount: number): Promise<Balance> {
    const balance = await this.findByUserId(userId);
    if (!balance) {
      throw new Error('Balance not found');
    }
    balance.currentBalance += amount;
    return this.save(balance);
  }

  async updateDailyChargeAmount(
    userId: number,
    amount: number,
  ): Promise<Balance> {
    const balance = await this.findByUserId(userId);
    if (!balance) {
      throw new Error('Balance not found');
    }
    balance.dailyChargeAmount += amount;
    return this.save(balance);
  }

  async resetDailyChargeAmount(userId: number): Promise<Balance> {
    const balance = await this.findByUserId(userId);
    if (!balance) {
      throw new Error('Balance not found');
    }
    balance.dailyChargeAmount = 0;
    return this.save(balance);
  }
}

@Injectable()
export class MemoryBalanceTransactionRepository extends BalanceTransactionRepository {
  private transactions: Map<number, BalanceTransaction> = new Map();
  private currentId = 1;

  constructor() {
    super();
    this.initializeData();
  }

  private initializeData(): void {
    const transactions = [
      {
        id: 1,
        userId: 1,
        transactionType: TransactionType.CHARGE,
        amount: 50000,
        balanceBefore: 0,
        balanceAfter: 50000,
        description: 'Initial charge',
      },
      {
        id: 2,
        userId: 2,
        transactionType: TransactionType.CHARGE,
        amount: 100000,
        balanceBefore: 0,
        balanceAfter: 100000,
        description: 'Initial charge',
      },
    ];

    transactions.forEach((transactionData) => {
      const transaction = new BalanceTransaction();
      Object.assign(transaction, transactionData);
      transaction.createdAt = new Date();
      this.transactions.set(transaction.id, transaction);
    });

    this.currentId = Math.max(...transactions.map((t) => t.id)) + 1;
  }

  async findByUserId(
    userId: number,
    limit?: number,
  ): Promise<BalanceTransaction[]> {
    const userTransactions = Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  async save(transaction: BalanceTransaction): Promise<BalanceTransaction> {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async create(
    transactionData: Partial<BalanceTransaction>,
  ): Promise<BalanceTransaction> {
    const transaction = new BalanceTransaction();
    Object.assign(transaction, transactionData);
    transaction.id = this.currentId++;
    transaction.createdAt = new Date();
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async findByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<BalanceTransaction[]> {
    return Array.from(this.transactions.values())
      .filter(
        (t) =>
          t.userId === userId &&
          t.createdAt >= startDate &&
          t.createdAt <= endDate,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
