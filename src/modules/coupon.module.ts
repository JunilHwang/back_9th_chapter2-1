import { Module } from '@nestjs/common';
import { CouponController } from '../controllers';
import { CouponUseCase } from '../use-cases';
import {
  CouponEventRepository,
  CouponRepository,
  MemoryCouponEventRepository,
  MemoryCouponRepository,
} from '../repositories';

@Module({
  controllers: [CouponController],
  providers: [
    CouponUseCase,
    {
      provide: CouponRepository,
      useClass: MemoryCouponRepository,
    },
    {
      provide: CouponEventRepository,
      useClass: MemoryCouponEventRepository,
    },
  ],
  exports: [CouponUseCase, CouponRepository, CouponEventRepository],
})
export class CouponModule {}
