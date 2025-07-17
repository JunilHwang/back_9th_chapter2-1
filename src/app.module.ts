import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MockDatabaseModule } from './database/mock/database.mock.module';
import { AppController } from './app.controller';
import {
  BalanceModule,
  CouponModule,
  OrderModule,
  ProductModule,
} from './modules';

const DatabaseModuleForEnv =
  process.env.NODE_ENV === 'test' ? MockDatabaseModule : DatabaseModule;

@Module({
  imports: [
    DatabaseModuleForEnv,
    BalanceModule,
    ProductModule,
    CouponModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
