-- ────────────────────────────────────────────────────────────────
-- created_at was omitted from these tables in 001_init.sql but the
-- repositories order/filter on it (e.g. notes ORDER BY created_at DESC).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE interview_participants
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notes_interview  ON notes(interview_id);
CREATE INDEX IF NOT EXISTS idx_notes_author     ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interview ON feedback(interview_id);