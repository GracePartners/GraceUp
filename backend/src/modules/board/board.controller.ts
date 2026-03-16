import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { WorkspaceMemberGuard } from '../../shared/guards/workspace-member.guard';
  import { BoardService } from './board.service';
  
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @Controller()
  export class BoardController {
  
    constructor(private readonly boardService: BoardService) {}
  
    @Get('workspaces/:workspaceId/board')
    getBoard(
      @Param('workspaceId') workspaceId: string,
      @Query('projectId') projectId: string
    ) {
  
      return this.boardService.getBoard({
        workspaceId,
        projectId
      });
  
    }
  
  }