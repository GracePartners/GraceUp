import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    UseGuards
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { TasksService } from './tasks.service';
  import { WorkspaceMemberGuard } from '../../shared/guards/workspace-member.guard';
  
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @Controller()
  export class TasksController {
  
    constructor(private readonly tasksService: TasksService) {}
  
    @Post('workspaces/:workspaceId/tasks')
    create(
      @Param('workspaceId') workspaceId: string,
      @Body() body: {
        listId: string;
        title: string;
        description?: string;
        position?: number;
      }
    ) {
      return this.tasksService.createTask({
        ...body,
        workspaceId
      });
    }
  
    @Get('workspaces/:workspaceId/tasks')
    list(
      @Param('workspaceId') workspaceId: string,
      @Query('listId') listId: string
    ) {
      return this.tasksService.listTasks({
        workspaceId,
        listId
      });
    }
  
  }