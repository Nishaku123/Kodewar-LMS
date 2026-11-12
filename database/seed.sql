-- ============================================================
-- KODEWAR LMS — ROLE SEED DATA
-- ============================================================
-- Roles are safe to seed from SQL because they contain no secrets.
--
-- The four demo user accounts are created by `npm run db:seed` instead.
-- That script hashes each password with bcrypt at run time, so no password
-- hash or plain-text password is committed to the repository.
-- ============================================================

INSERT INTO roles (name, description) VALUES
  ('student', 'Learns courses, completes lessons and earns certificates'),
  ('trainer', 'Creates and reviews learning content and assessments'),
  ('admin', 'Manages users, courses and platform operations')
ON DUPLICATE KEY UPDATE description = VALUES(description);
