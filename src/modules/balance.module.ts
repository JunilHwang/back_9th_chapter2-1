import { Module } from '@nestjs/common';
import { BalanceController } from '../controllers';
import { BalanceUseCase } from '../use-cases';
import {
  BalanceRepository,
  BalanceTransactionRepository,
  MemoryBalanceRepository,
  MemoryBalanceTransactionRepository,
  MemoryUserRepository,
  UserRepository,
} from '../repositories';

@Module({
  controllers: [BalanceController],
  providers: [
    BalanceUseCase,
    {
      provide: UserRepository,
      useClass: MemoryUserRepository,
    },
    {
      provide: BalanceRepository,
      useClass: MemoryBalanceRepository,
    },
    {
      provide: BalanceTransactionRepository,
      useClass: MemoryBalanceTransactionRepository,
    },
  ],
  exports: [
    BalanceUseCase,
    UserRepository,
    BalanceRepository,
    BalanceTransactionRepository,
  ],
})
export class BalanceModule {}
