import { Module } from '@nestjs/common';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [ListsController],
  providers: [ListsService],
})
export class ListsModule {}