import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ActivityService]
})
export class ActivityModule {}