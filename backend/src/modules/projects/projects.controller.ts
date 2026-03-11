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
  import { ProjectsService } from './projects.service';
  import { WorkspaceMemberGuard } from '../../shared/guards/workspace-member.guard';
  
  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @Controller()
  export class ProjectsController {
  
    constructor(private readonly projectsService: ProjectsService) {}
  
    @Post('workspaces/:workspaceId/projects')
    create(
      @Param('workspaceId') workspaceId: string,
      @Body() body: {
        spaceId: string;
        name: string;
        position?: number;
      }
    ) {
      return this.projectsService.createProject({
        ...body,
        workspaceId
      });
    }
  
    @Get('workspaces/:workspaceId/projects')
    list(
      @Param('workspaceId') workspaceId: string,
      @Query('spaceId') spaceId: string
    ) {
      return this.projectsService.listProjects({
        workspaceId,
        spaceId
      });
    }
  
  }