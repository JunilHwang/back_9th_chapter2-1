import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MockDatabaseModule } from './database/mock/database.mock.module';
import { AppController } from './app.controller';

const DatabaseModuleForEnv =
  process.env.NODE_ENV === 'test' ? MockDatabaseModule : DatabaseModule;

@Module({
  imports: [DatabaseModuleForEnv],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
