BEGIN;

DO $$
BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'in_app',
    'email',
    'push'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT notifications_workspace_id_id_uniq UNIQUE (workspace_id, id),
  CONSTRAINT notifications_event_type_not_blank CHECK (btrim(event_type) <> ''),
  CONSTRAINT notifications_title_not_blank CHECK (btrim(title) <> '')
);

CREATE INDEX notifications_workspace_created_at_idx
  ON notifications (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX notifications_workspace_entity_idx
  ON notifications (workspace_id, entity_type, entity_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_notifications_set_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  delivered_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT notification_recipients_notification_user_channel_uniq
    UNIQUE (notification_id, user_id, channel),
  CONSTRAINT notification_recipients_notification_fk
    FOREIGN KEY (workspace_id, notification_id)
    REFERENCES notifications (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT notification_recipients_member_fk
    FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_members (workspace_id, user_id) ON DELETE CASCADE,
  CONSTRAINT notification_recipients_read_consistency
    CHECK (read_at IS NULL OR is_read = TRUE)
);

CREATE INDEX notification_recipients_user_unread_idx
  ON notification_recipients (user_id, created_at DESC)
  WHERE is_read = FALSE AND deleted_at IS NULL;

CREATE INDEX notification_recipients_notification_idx
  ON notification_recipients (notification_id, user_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_notification_recipients_set_updated_at
  BEFORE UPDATE ON notification_recipients
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  channel notification_channel NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT notification_preferences_workspace_user_event_channel_uniq
    UNIQUE (workspace_id, user_id, event_type, channel),
  CONSTRAINT notification_preferences_member_fk
    FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_members (workspace_id, user_id) ON DELETE CASCADE,
  CONSTRAINT notification_preferences_event_type_not_blank
    CHECK (btrim(event_type) <> '')
);

CREATE INDEX notification_preferences_user_idx
  ON notification_preferences (user_id, workspace_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_notification_preferences_set_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id
  ON activity_logs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at DESC);

COMMIT;
