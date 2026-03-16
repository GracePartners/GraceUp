import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class ListsService {

    constructor(
        private readonly database: DatabaseService,
        private readonly redis: RedisService
      ) {}

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

  async getBoard(data: {
    workspaceId: string;
    projectId: string;
  }) {
  
    const cacheKey = `board:${data.workspaceId}:${data.projectId}`;
  
    const cached = await this.redis.get(cacheKey);
  
    if (cached) {
      return cached;
    }
  
    const result = await this.database.query(
      `
      SELECT
        l.id as list_id,
        l.name as list_name,
        l.position as list_position,
        t.id as task_id,
        t.title as task_title,
        t.description as task_description,
        t.position as task_position
      FROM lists l
      LEFT JOIN tasks t
        ON t.list_id = l.id
        AND t.deleted_at IS NULL
      WHERE l.workspace_id = $1
      AND l.project_id = $2
      AND l.deleted_at IS NULL
      ORDER BY
        l.position ASC,
        t.position ASC
      `,
      [data.workspaceId, data.projectId]
    );
  
    await this.redis.set(cacheKey, result.rows, 60);
  
    return result.rows;
  }

}