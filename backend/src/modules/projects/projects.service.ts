import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class ProjectsService {

  constructor(private readonly database: DatabaseService) {}

  async createProject(data: {
    workspaceId: string;
    spaceId: string;
    name: string;
    position?: number;
  }) {

    if (!data.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!data.spaceId) {
      throw new BadRequestException('spaceId is required');
    }

    if (!data.name) {
      throw new BadRequestException('name is required');
    }

    const result = await this.database.query(
      `
      INSERT INTO projects (workspace_id, space_id, name, position)
      VALUES ($1, $2, $3, $4)
      RETURNING id, workspace_id, space_id, name, position, created_at
      `,
      [
        data.workspaceId,
        data.spaceId,
        data.name,
        data.position ?? 0
      ]
    );

    return result.rows[0];
  }

  async listProjects(spaceId: string) {

    const result = await this.database.query(
      `
      SELECT
        id,
        workspace_id,
        space_id,
        name,
        position,
        created_at
      FROM projects
      WHERE space_id = $1
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [spaceId]
    );

    return result.rows;
  }

}