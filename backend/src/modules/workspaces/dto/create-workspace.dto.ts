export class CreateWorkspaceDto {
  name!: string;
  slug!: string;
  ownerUserId!: string;
  createdBy?: string;
}
