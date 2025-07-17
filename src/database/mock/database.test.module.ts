import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [],
      synchronize: true,
      dropSchema: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class TestDatabaseModule {}
