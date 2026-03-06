import { Module } from '@nestjs/common';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SpacesController],
  providers: [SpacesService],
})
export class SpacesModule {}