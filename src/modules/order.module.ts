import { Module } from '@nestjs/common';
import { OrderController } from '../controllers';
import { OrderUseCase } from '../use-cases';
import {
  MemoryOrderProductRepository,
  MemoryOrderRepository,
  MemoryPaymentRepository,
  OrderProductRepository,
  OrderRepository,
  PaymentRepository,
} from '../repositories';
import { BalanceModule } from './balance.module';
import { ProductModule } from './product.module';
import { CouponModule } from './coupon.module';

@Module({
  imports: [BalanceModule, ProductModule, CouponModule],
  controllers: [OrderController],
  providers: [
    OrderUseCase,
    {
      provide: OrderRepository,
      useClass: MemoryOrderRepository,
    },
    {
      provide: OrderProductRepository,
      useClass: MemoryOrderProductRepository,
    },
    {
      provide: PaymentRepository,
      useClass: MemoryPaymentRepository,
    },
  ],
  exports: [
    OrderUseCase,
    OrderRepository,
    OrderProductRepository,
    PaymentRepository,
  ],
})
export class OrderModule {}
