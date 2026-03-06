import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { ProjectsService } from './projects.service';
  
  @UseGuards(JwtAuthGuard)
  @Controller('projects')
  export class ProjectsController {
  
    constructor(private readonly projectsService: ProjectsService) {}
  
    @Post()
    create(
      @Body() body: {
        workspaceId: string;
        spaceId: string;
        name: string;
        position?: number;
      }
    ) {
      return this.projectsService.createProject(body);
    }
  
    @Get()
    list(
      @Query('spaceId') spaceId: string
    ) {
      return this.projectsService.listProjects(spaceId);
    }
  
  }