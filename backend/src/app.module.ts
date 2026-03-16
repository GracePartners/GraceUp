  import { Module } from '@nestjs/common';
  import { WorkspacesModule } from './modules/workspaces/workspaces.module';
  import { AuthModule } from './modules/auth/auth.module';
  import { SpacesModule } from './modules/spaces/spaces.module';
  import { ProjectsModule } from './modules/projects/projects.module';
  import { ListsModule } from './modules/lists/lists.module';
  import { TasksModule } from './modules/tasks/tasks.module';
  import { RealtimeModule } from './modules/realtime/realtime.module';
  import { EventEmitterModule } from '@nestjs/event-emitter';
  import { ActivityModule } from './modules/activity/activity.module';
  import { BoardModule } from './modules/board/board.module';

  @Module({
    imports: [AuthModule, WorkspacesModule, SpacesModule, ProjectsModule, ListsModule, TasksModule, RealtimeModule, EventEmitterModule.forRoot(), ActivityModule, BoardModule]
  })
  export class AppModule {}
