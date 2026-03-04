import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ListWorkspacesDto } from './dto/list-workspaces.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

type WorkspaceResponse = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WorkspacesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createWorkspaceDto: CreateWorkspaceDto): Promise<WorkspaceResponse> {
    if (
      !this.hasText(createWorkspaceDto.name) ||
      !this.hasText(createWorkspaceDto.slug) ||
      !this.hasText(createWorkspaceDto.ownerUserId)
    ) {
      throw new BadRequestException('name, slug and ownerUserId are required');
    }

    const actorUserId = createWorkspaceDto.createdBy ?? createWorkspaceDto.ownerUserId;

    try {
      const result = await this.databaseService.query<WorkspaceRow>(
        `
        INSERT INTO workspaces (name, slug, owner_user_id, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING id, name, slug, owner_user_id, created_by, updated_by, created_at, updated_at, deleted_at
        `,
        [createWorkspaceDto.name, createWorkspaceDto.slug, createWorkspaceDto.ownerUserId, actorUserId]
      );

      return this.toWorkspaceResponse(result.rows[0]);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(listWorkspacesDto: ListWorkspacesDto): Promise<WorkspaceResponse[]> {
    if (listWorkspacesDto.ownerUserId !== undefined && !this.hasText(listWorkspacesDto.ownerUserId)) {
      throw new BadRequestException('ownerUserId must be a non-empty string');
    }

    const whereClauses = ['deleted_at IS NULL'];
    const values: unknown[] = [];

    if (listWorkspacesDto.ownerUserId) {
      values.push(listWorkspacesDto.ownerUserId);
      whereClauses.push(`owner_user_id = $${values.length}`);
    }

    try {
      const result = await this.databaseService.query<WorkspaceRow>(
        `
        SELECT
          id,
          name,
          slug,
          owner_user_id,
          created_by,
          updated_by,
          created_at,
          updated_at,
          deleted_at
        FROM workspaces
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY created_at DESC
        `,
        values
      );

      return result.rows.map((workspace) => this.toWorkspaceResponse(workspace));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findOne(id: string): Promise<WorkspaceResponse> {
    if (!this.hasText(id)) {
      throw new BadRequestException('workspace id is required');
    }

    try {
      const result = await this.databaseService.query<WorkspaceRow>(
        `
        SELECT
          id,
          name,
          slug,
          owner_user_id,
          created_by,
          updated_by,
          created_at,
          updated_at,
          deleted_at
        FROM workspaces
        WHERE id = $1
          AND deleted_at IS NULL
        `,
        [id]
      );

      const workspace = result.rows[0];

      if (!workspace) {
        throw new NotFoundException(`Workspace ${id} not found`);
      }

      return this.toWorkspaceResponse(workspace);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDatabaseError(error);
    }
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto): Promise<WorkspaceResponse> {
    if (!this.hasText(id)) {
      throw new BadRequestException('workspace id is required');
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (updateWorkspaceDto.name !== undefined) {
      values.push(updateWorkspaceDto.name);
      updates.push(`name = $${values.length}`);
    }

    if (updateWorkspaceDto.slug !== undefined) {
      values.push(updateWorkspaceDto.slug);
      updates.push(`slug = $${values.length}`);
    }

    if (updateWorkspaceDto.ownerUserId !== undefined) {
      values.push(updateWorkspaceDto.ownerUserId);
      updates.push(`owner_user_id = $${values.length}`);
    }

    if (updateWorkspaceDto.updatedBy !== undefined) {
      values.push(updateWorkspaceDto.updatedBy);
      updates.push(`updated_by = $${values.length}`);
    }

    if (updates.length === 0) {
      throw new BadRequestException('At least one field must be provided for update');
    }

    values.push(id);

    try {
      const result = await this.databaseService.query<WorkspaceRow>(
        `
        UPDATE workspaces
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
          AND deleted_at IS NULL
        RETURNING id, name, slug, owner_user_id, created_by, updated_by, created_at, updated_at, deleted_at
        `,
        values
      );

      const workspace = result.rows[0];

      if (!workspace) {
        throw new NotFoundException(`Workspace ${id} not found`);
      }

      return this.toWorkspaceResponse(workspace);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDatabaseError(error);
    }
  }

  async softDelete(id: string, deletedBy?: string): Promise<{ id: string; deletedAt: Date }> {
    if (!this.hasText(id)) {
      throw new BadRequestException('workspace id is required');
    }

    try {
      const result = await this.databaseService.query<{ id: string; deleted_at: Date }>(
        `
        UPDATE workspaces
        SET deleted_at = NOW(),
            updated_by = $1
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING id, deleted_at
        `,
        [deletedBy ?? null, id]
      );

      const workspace = result.rows[0];

      if (!workspace) {
        throw new NotFoundException(`Workspace ${id} not found`);
      }

      return {
        id: workspace.id,
        deletedAt: workspace.deleted_at
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDatabaseError(error);
    }
  }

  private toWorkspaceResponse(workspace: WorkspaceRow): WorkspaceResponse {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      ownerUserId: workspace.owner_user_id,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at
    };
  }

  private handleDatabaseError(error: unknown): never {
    if (this.isDatabaseError(error)) {
      if (error.code === '23505') {
        throw new ConflictException('A workspace with the same unique value already exists');
      }

      if (error.code === '22P02' || error.code === '23503' || error.code === '23514') {
        throw new BadRequestException('Invalid data for workspace operation');
      }
    }

    throw new InternalServerErrorException('Workspace operation failed');
  }

  private hasText(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isDatabaseError(error: unknown): error is { code: string } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string';
  }
}
