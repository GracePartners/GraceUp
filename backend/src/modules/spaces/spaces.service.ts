import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class SpacesService {

  constructor(private readonly database: DatabaseService) {}

  async createSpace(data: {
    workspaceId: string;
    name: string;
    position?: number;
  }) {

    if (!data.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!data.name) {
      throw new BadRequestException('name is required');
    }

    const result = await this.database.query(
      `
      INSERT INTO spaces (workspace_id, name, position)
      VALUES ($1, $2, $3)
      RETURNING id, workspace_id, name, position, created_at
      `,
      [
        data.workspaceId,
        data.name,
        data.position ?? 0
      ]
    );

    return result.rows[0];
  }

  async listSpaces(workspaceId: string) {

    const result = await this.database.query(
      `
      SELECT
        id,
        workspace_id,
        name,
        position,
        created_at
      FROM spaces
      WHERE workspace_id = $1
      AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [workspaceId]
    );

    return result.rows;
  }

}