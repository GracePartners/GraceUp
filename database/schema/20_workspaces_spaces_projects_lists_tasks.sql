BEGIN;

DO $$
BEGIN
  CREATE TYPE workspace_member_role AS ENUM (
    'owner',
    'admin',
    'member',
    'guest'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE task_status AS ENUM (
    'backlog',
    'todo',
    'in_progress',
    'in_review',
    'done',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT workspaces_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT workspaces_slug_not_blank CHECK (btrim(slug) <> '')
);

CREATE UNIQUE INDEX workspaces_slug_uniq_active_idx
  ON workspaces (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX workspaces_owner_user_id_idx
  ON workspaces (owner_user_id);

CREATE TRIGGER trg_workspaces_set_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role workspace_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT workspace_members_workspace_user_uniq UNIQUE (workspace_id, user_id)
);

CREATE INDEX workspace_members_user_workspace_idx
  ON workspace_members (user_id, workspace_id);

CREATE INDEX workspace_members_workspace_role_idx
  ON workspace_members (workspace_id, role)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_workspace_members_set_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT spaces_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT spaces_position_non_negative CHECK (position >= 0),
  CONSTRAINT spaces_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX spaces_workspace_position_idx
  ON spaces (workspace_id, position, id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_spaces_set_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  space_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT projects_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT projects_space_fk FOREIGN KEY (workspace_id, space_id)
    REFERENCES spaces (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT projects_position_non_negative CHECK (position >= 0),
  CONSTRAINT projects_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT projects_due_after_start CHECK (due_at IS NULL OR start_at IS NULL OR due_at >= start_at),
  CONSTRAINT projects_completed_after_start CHECK (
    completed_at IS NULL OR start_at IS NULL OR completed_at >= start_at
  )
);

CREATE INDEX projects_space_position_idx
  ON projects (space_id, position, id)
  WHERE deleted_at IS NULL;

CREATE INDEX projects_workspace_due_idx
  ON projects (workspace_id, due_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_projects_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT lists_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT lists_project_fk FOREIGN KEY (workspace_id, project_id)
    REFERENCES projects (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT lists_position_non_negative CHECK (position >= 0),
  CONSTRAINT lists_name_not_blank CHECK (btrim(name) <> '')
);

CREATE INDEX lists_project_position_idx
  ON lists (project_id, position, id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_lists_set_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  list_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',

  estimate_minutes INTEGER,
  archived_at TIMESTAMPTZ,

  position INTEGER NOT NULL DEFAULT 0,
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT tasks_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT tasks_list_fk FOREIGN KEY (workspace_id, list_id)
    REFERENCES lists (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT tasks_position_non_negative CHECK (position >= 0),
  CONSTRAINT tasks_title_not_blank CHECK (btrim(title) <> ''),
  CONSTRAINT tasks_due_after_start CHECK (due_at IS NULL OR start_at IS NULL OR due_at >= start_at),
  CONSTRAINT tasks_completed_after_start CHECK (
    completed_at IS NULL OR start_at IS NULL OR completed_at >= start_at
  )
);

CREATE INDEX tasks_list_position_idx
  ON tasks (list_id, position, id)
  WHERE deleted_at IS NULL;

CREATE INDEX tasks_workspace_status_idx
  ON tasks (workspace_id, status, priority)
  WHERE deleted_at IS NULL;

CREATE INDEX tasks_workspace_due_idx
  ON tasks (workspace_id, due_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT task_assignees_task_user_uniq UNIQUE (task_id, user_id),
  CONSTRAINT task_assignees_task_fk FOREIGN KEY (workspace_id, task_id)
    REFERENCES tasks (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT task_assignees_member_fk FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_members (workspace_id, user_id) ON DELETE CASCADE
);

CREATE INDEX task_assignees_user_idx
  ON task_assignees (user_id, task_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_task_assignees_set_updated_at
  BEFORE UPDATE ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  task_id UUID NOT NULL,
  parent_comment_id UUID,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT task_comments_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT task_comments_workspace_task_id_id_uniq UNIQUE (workspace_id, task_id, id),
  CONSTRAINT task_comments_task_fk FOREIGN KEY (workspace_id, task_id)
    REFERENCES tasks (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT task_comments_parent_fk FOREIGN KEY (workspace_id, task_id, parent_comment_id)
    REFERENCES task_comments (workspace_id, task_id, id) ON DELETE SET NULL,
  CONSTRAINT task_comments_body_not_blank CHECK (btrim(body) <> '')
);

CREATE INDEX task_comments_task_created_at_idx
  ON task_comments (task_id, created_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_task_comments_set_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  checksum_sha256 TEXT,
  created_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT files_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT files_storage_key_uniq UNIQUE (storage_key),
  CONSTRAINT files_storage_key_not_blank CHECK (btrim(storage_key) <> ''),
  CONSTRAINT files_file_name_not_blank CHECK (btrim(file_name) <> ''),
  CONSTRAINT files_mime_type_not_blank CHECK (btrim(mime_type) <> ''),
  CONSTRAINT files_byte_size_positive CHECK (byte_size > 0)
);

CREATE INDEX files_workspace_created_at_idx
  ON files (workspace_id, created_at)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_files_set_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  task_id UUID NOT NULL,
  file_id UUID NOT NULL,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT task_attachments_task_file_uniq UNIQUE (task_id, file_id),
  CONSTRAINT task_attachments_task_fk FOREIGN KEY (workspace_id, task_id)
    REFERENCES tasks (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT task_attachments_file_fk FOREIGN KEY (workspace_id, file_id)
    REFERENCES files (workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX task_attachments_task_idx
  ON task_attachments (task_id, file_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_task_attachments_set_updated_at
  BEFORE UPDATE ON task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
