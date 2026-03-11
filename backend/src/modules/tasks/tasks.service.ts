import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class TasksService {

  constructor(private readonly database: DatabaseService) {}

  async createTask(data: {
    workspaceId: string;
    listId: string;
    title: string;
    description?: string;
    position?: number;
  }) {

    const { workspaceId, listId, title, description, position } = data;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!listId) {
      throw new BadRequestException('listId is required');
    }

    if (!title) {
      throw new BadRequestException('title is required');
    }

    const result = await this.database.query(
      `
      INSERT INTO tasks (
        workspace_id,
        list_id,
        title,
        description,
        position
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        workspace_id,
        list_id,
        title,
        description,
        position,
        created_at
      `,
      [
        workspaceId,
        listId,
        title,
        description ?? null,
        position ?? 0
      ]
    );

    return result.rows[0];
  }

  async listTasks(data: {
    workspaceId: string;
    listId: string;
  }) {

    const { workspaceId, listId } = data;

    const result = await this.database.query(
      `
      SELECT
        id,
        workspace_id,
        list_id,
        title,
        description,
        position,
        created_at
      FROM tasks
      WHERE workspace_id = $1
      AND list_id = $2
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [workspaceId, listId]
    );

    return result.rows;
  }

}