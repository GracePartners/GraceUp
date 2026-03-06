import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards
  } from '@nestjs/common';
  
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { SpacesService } from './spaces.service';
  
  @UseGuards(JwtAuthGuard)
  @Controller('spaces')
  export class SpacesController {
  
    constructor(private readonly spacesService: SpacesService) {}
  
    @Post()
    create(
      @Body() body: {
        workspaceId: string;
        name: string;
        position?: number;
      }
    ) {
      return this.spacesService.createSpace(body);
    }
  
    @Get()
    list(
      @Query('workspaceId') workspaceId: string
    ) {
      return this.spacesService.listSpaces(workspaceId);
    }
  
  }