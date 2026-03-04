import { Module } from '@nestjs/common';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule]
})
export class AppModule {}
