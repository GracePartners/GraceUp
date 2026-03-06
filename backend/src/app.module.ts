import { Module } from '@nestjs/common';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { AuthModule } from './modules/auth/auth.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ListsModule } from './modules/lists/lists.module';

@Module({
  imports: [AuthModule, WorkspacesModule, SpacesModule, ProjectsModule, ListsModule]
})
export class AppModule {}
