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
  import { ListsService } from './lists.service';
  import { WorkspaceMemberGuard } from '../../shared/guards/workspace-member.guard';
  
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @Controller()
  export class ListsController {
  
    constructor(private readonly listsService: ListsService) {}
  
    @Post('workspaces/:workspaceId/lists')
    create(
      @Param('workspaceId') workspaceId: string,
      @Body() body: {
        projectId: string;
        name: string;
        position?: number;
      }
    ) {
      return this.listsService.createList({
        ...body,
        workspaceId
      });
    }
  
    @Get('workspaces/:workspaceId/lists')
    list(
      @Param('workspaceId') workspaceId: string,
      @Query('projectId') projectId: string
    ) {
      return this.listsService.listLists(workspaceId, projectId);
    }

    @Get('workspaces/:workspaceId/board')
    getBoard(
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId: string
    ) {
    return this.listsService.getBoard({
        workspaceId,
        projectId
    });
    }
  
  }