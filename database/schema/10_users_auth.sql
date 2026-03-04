BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  CREATE TYPE auth_provider AS ENUM (
    'password',
    'google',
    'microsoft',
    'github',
    'saml'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT users_email_not_blank CHECK (btrim(email::TEXT) <> ''),
  CONSTRAINT users_full_name_not_blank CHECK (btrim(full_name) <> '')
);

CREATE UNIQUE INDEX users_email_uniq_active_idx
  ON users (email)
  WHERE deleted_at IS NULL;

CREATE INDEX users_deleted_at_idx
  ON users (deleted_at);

CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider auth_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT auth_identities_provider_user_id_not_blank CHECK (btrim(provider_user_id) <> ''),
  CONSTRAINT auth_identities_password_required_for_password_provider CHECK (
    provider <> 'password' OR password_hash IS NOT NULL
  )
);

CREATE UNIQUE INDEX auth_identities_provider_uid_uniq_active_idx
  ON auth_identities (provider, provider_user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX auth_identities_user_id_idx
  ON auth_identities (user_id);

CREATE TRIGGER trg_auth_identities_set_updated_at
  BEFORE UPDATE ON auth_identities
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT auth_sessions_refresh_token_hash_not_blank CHECK (btrim(refresh_token_hash) <> ''),
  CONSTRAINT auth_sessions_expires_after_created CHECK (expires_at > created_at),
  CONSTRAINT auth_sessions_revoked_after_created CHECK (
    revoked_at IS NULL OR revoked_at >= created_at
  )
);

CREATE UNIQUE INDEX auth_sessions_refresh_token_hash_uniq_idx
  ON auth_sessions (refresh_token_hash);

CREATE INDEX auth_sessions_user_id_idx
  ON auth_sessions (user_id);

CREATE INDEX auth_sessions_active_expires_idx
  ON auth_sessions (expires_at)
  WHERE revoked_at IS NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_auth_sessions_set_updated_at
  BEFORE UPDATE ON auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
