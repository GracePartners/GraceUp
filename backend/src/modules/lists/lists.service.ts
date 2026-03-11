import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class ListsService {

  constructor(private readonly database: DatabaseService) {}

  async createList(data: {
    workspaceId: string;
    projectId: string;
    name: string;
    position?: number;
  }) {

    if (!data.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!data.projectId) {
      throw new BadRequestException('projectId is required');
    }

    if (!data.name) {
      throw new BadRequestException('name is required');
    }

    const result = await this.database.query(
      `
      INSERT INTO lists (workspace_id, project_id, name, position)
      VALUES ($1, $2, $3, $4)
      RETURNING id, workspace_id, project_id, name, position, created_at
      `,
      [
        data.workspaceId,
        data.projectId,
        data.name,
        data.position ?? 0
      ]
    );

    return result.rows[0];
  }

  async listLists(workspaceId: string, projectId: string) {

    const result = await this.database.query(
      `
      SELECT
        id,
        workspace_id,
        project_id,
        name,
        position,
        created_at
      FROM lists
      WHERE workspace_id = $1
      AND project_id = $2
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [workspaceId, projectId]
    );

    return result.rows;
  }

}