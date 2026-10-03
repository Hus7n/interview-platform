-- ────────────────────────────────────────────────────────────────
-- Reconciles the database with the columns and tables the
-- repositories already reference but the earlier migrations
-- never created (auth sessions, email verification, password
-- reset, notification types, and audit timestamps).
-- ────────────────────────────────────────────────────────────────

-- users: lifecycle + verification + password-reset state
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verify_token          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS verify_token_expires  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reset_token           VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token_expires   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- profiles: avatar + timestamps
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS avatar_url  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- interviews: audit timestamp used by PATCH and the auto-complete job
ALTER TABLE interviews
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- notifications: category discriminator used by the repo filters and scheduler
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'general';

-- sessions: server-side refresh tokens (required for /auth/refresh and logout)
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Lookup support for the auth token queries
CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users(verify_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token  ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);