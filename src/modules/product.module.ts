import { Module } from '@nestjs/common';
import { ProductController } from '../controllers';
import { ProductUseCase } from '../use-cases';
import {
  MemoryProductRepository,
  MemorySalesStatisticsRepository,
  ProductRepository,
  SalesStatisticsRepository,
} from '../repositories';

@Module({
  controllers: [ProductController],
  providers: [
    ProductUseCase,
    {
      provide: ProductRepository,
      useClass: MemoryProductRepository,
    },
    {
      provide: SalesStatisticsRepository,
      useClass: MemorySalesStatisticsRepository,
    },
  ],
  exports: [ProductUseCase, ProductRepository, SalesStatisticsRepository],
})
export class ProductModule {}
