import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { DeleteWorkspaceDto } from './dto/delete-workspace.dto';
import { ListWorkspacesDto } from './dto/list-workspaces.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  findAll(@Query() listWorkspacesDto: ListWorkspacesDto) {
    return this.workspacesService.findAll(listWorkspacesDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Body() deleteWorkspaceDto: DeleteWorkspaceDto) {
    return this.workspacesService.softDelete(id, deleteWorkspaceDto.deletedBy);
  }
}
