-- ============================================================
-- 001 — Phase 7 publish defaults and grading index
-- ============================================================
-- New assessments and assignments must start as drafts so staff can add
-- questions/options or instructions before students can see them. The API
-- already enforces this; the database defaults now match.
--
-- This file is applied once by `npm run db:migrate` and recorded in the
-- schema_migrations table. Do not edit an applied migration; add a new one.
-- ============================================================

ALTER TABLE assessments
  MODIFY COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE assignments
  MODIFY COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0;

-- Grading looks up the single correct option for each question. This index
-- keeps that lookup cheap as the question bank grows.
CREATE INDEX idx_assessment_options_correct
  ON assessment_options (question_id, is_correct);
