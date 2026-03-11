import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException
  } from '@nestjs/common';
  
  import { DatabaseService } from '../database/database.service';
  
  @Injectable()
  export class WorkspaceMemberGuard implements CanActivate {
  
    constructor(private readonly database: DatabaseService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      const workspaceId =
        request.body.workspaceId ||
        request.query.workspaceId ||
        request.params.workspaceId;
        
      if (!workspaceId) {
        throw new ForbiddenException('workspaceId missing');
      }
  
      const result = await this.database.query(
        `
        SELECT id
        FROM workspace_members
        WHERE workspace_id = $1
        AND user_id = $2
        AND deleted_at IS NULL
        `,
        [workspaceId, user.userId]
      );
  
      if (result.rows.length === 0) {
        throw new ForbiddenException('No access to this workspace');
      }
  
      return true;
    }
  }