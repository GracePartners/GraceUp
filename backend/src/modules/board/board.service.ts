import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class BoardService {

  constructor(private readonly database: DatabaseService) {}

  async getBoard(data: {
    workspaceId: string;
    projectId: string;
  }) {

    const listsResult = await this.database.query(
      `
      SELECT
        id,
        name,
        position
      FROM lists
      WHERE workspace_id = $1
      AND project_id = $2
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [data.workspaceId, data.projectId]
    );

    const lists = listsResult.rows;

    const tasksResult = await this.database.query(
      `
      SELECT
        id,
        name,
        list_id,
        position
      FROM tasks
      WHERE workspace_id = $1
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [data.workspaceId]
    );

    const tasks = tasksResult.rows;

    const listsWithTasks = lists.map((list: any) => ({
      ...list,
      tasks: tasks.filter((task: any) => task.list_id === list.id)
    }));

    return {
      lists: listsWithTasks
    };

  }

}