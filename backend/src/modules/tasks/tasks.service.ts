import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksService {

  constructor(
    private readonly database: DatabaseService,
    private readonly eventEmitter: EventEmitter2
  ) {}

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

  async moveTask(data: {
    workspaceId: string;
    taskId: string;
    targetListId: string;
    position: number;
  }) {
  
    const { workspaceId, taskId, targetListId, position } = data;
  
    const result = await this.database.query(
      `
      UPDATE tasks
      SET
        list_id = $1,
        position = $2,
        updated_at = NOW()
      WHERE id = $3
      AND workspace_id = $4
      AND deleted_at IS NULL
      RETURNING
        id,
        workspace_id,
        list_id,
        title,
        position,
        updated_at
      `,
      [
        targetListId,
        position,
        taskId,
        workspaceId
      ]
    );

    const task = result.rows[0];

    if (task) {
      this.eventEmitter.emit('task.moved', {
        taskId: task.id,
        workspaceId: task.workspace_id,
        listId: task.list_id,
        position: task.position
      });
    }
  
    return task;
  }

}