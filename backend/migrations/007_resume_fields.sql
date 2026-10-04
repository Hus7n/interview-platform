-- ────────────────────────────────────────────────────────────────
-- The resume upload endpoint returned a stored URL but never wrote it
-- anywhere, so an uploaded resume was unreachable once the response was
-- gone. Store the pointer alongside the avatar on the profile.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS resume_url           VARCHAR(500),
    ADD COLUMN IF NOT EXISTS resume_original_name VARCHAR(255);