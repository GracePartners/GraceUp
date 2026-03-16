

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class ActivityService {

  constructor(private readonly database: DatabaseService) {}

  @OnEvent('task.moved')
  async handleTaskMoved(event: {
    taskId: string;
    workspaceId: string;
    listId: string;
    position: number;
    userId?: string;
  }) {

    const message = `Task moved to a new list`;

    await this.database.query(
      `
      INSERT INTO activity_logs (
        workspace_id,
        user_id,
        event_type,
        entity_type,
        entity_id,
        message,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        event.workspaceId,
        event.userId ?? null,
        'task.moved',
        'task',
        event.taskId,
        message,
        JSON.stringify({
          listId: event.listId,
          position: event.position
        })
      ]
    );

  }

}