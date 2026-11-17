-- ============================================================
-- KODEWAR LMS — FULL DATABASE SCHEMA (Phases 3–7)
-- ============================================================
-- This file is safe to run more than once. Every statement uses
-- IF NOT EXISTS so an existing table is never destroyed.
--
-- Run it with:  npm run db:migrate
-- Numbered changes after the baseline live in database/migrations and are
-- applied in order by the same command.
-- ============================================================

-- Roles are stored in their own table so the application never relies on
-- hard-coded strings scattered across the codebase.
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) NOT NULL,
  description VARCHAR(160) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- One row per person who can sign in. Passwords are stored only as
-- bcrypt hashes (never plain text).
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Password reset tokens are stored as SHA-256 hashes. The raw token is only
-- ever sent to the user, so a database leak cannot be used to reset accounts.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_token (token_hash),
  KEY idx_password_reset_user (user_id),
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Published courses are visible in the student catalogue. Staff authoring
-- tools can manage this content in a later phase.
CREATE TABLE IF NOT EXISTS courses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'General',
  level VARCHAR(40) NOT NULL DEFAULT 'Beginner',
  thumbnail_url VARCHAR(2048) NULL,
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_slug (slug),
  KEY idx_courses_published (is_published, title)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_modules (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  week_number INT UNSIGNED NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_modules_week (course_id, week_number),
  KEY idx_course_modules_order (course_id, position),
  CONSTRAINT fk_course_modules_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 1,
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 0,
  video_provider ENUM('youtube', 'vimeo', 'direct') NULL,
  video_url VARCHAR(2048) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lessons_module_position (module_id, position),
  KEY idx_lessons_module (module_id),
  CONSTRAINT fk_lessons_module
    FOREIGN KEY (module_id) REFERENCES course_modules (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_enrollments (
  user_id BIGINT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  KEY idx_course_enrollments_course (course_id, user_id),
  CONSTRAINT fk_course_enrollments_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_course_enrollments_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- PHASE 5 — ASSESSMENTS, ASSIGNMENTS AND PROGRESS
-- ============================================================

-- A lesson is either complete for a student or it is not. The composite
-- primary key makes marking a lesson complete naturally idempotent.
CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id BIGINT UNSIGNED NOT NULL,
  lesson_id INT UNSIGNED NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  KEY idx_lesson_completions_lesson (lesson_id),
  CONSTRAINT fk_lesson_completions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lesson_completions_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Weekly quizzes/assessments belong to a module. `max_attempts = 0` means
-- unlimited attempts; `passing_score` is a percentage from 0 to 100.
CREATE TABLE IF NOT EXISTS assessments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  passing_score TINYINT UNSIGNED NOT NULL DEFAULT 60,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assessments_module (module_id, is_published),
  CONSTRAINT fk_assessments_module
    FOREIGN KEY (module_id) REFERENCES course_modules (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_questions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_id INT UNSIGNED NOT NULL,
  prompt TEXT NOT NULL,
  explanation TEXT NOT NULL,
  points TINYINT UNSIGNED NOT NULL DEFAULT 1,
  position INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_questions_position (assessment_id, position),
  KEY idx_assessment_questions_assessment (assessment_id),
  CONSTRAINT fk_assessment_questions_assessment
    FOREIGN KEY (assessment_id) REFERENCES assessments (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_options (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id INT UNSIGNED NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  position INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_options_position (question_id, position),
  KEY idx_assessment_options_question (question_id),
  CONSTRAINT fk_assessment_options_question
    FOREIGN KEY (question_id) REFERENCES assessment_questions (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- One row per attempt. `in_progress` attempts can be resumed; `submitted`
-- attempts are immutable and carry the graded result.
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_id INT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  status ENUM('in_progress', 'submitted') NOT NULL DEFAULT 'in_progress',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  score DECIMAL(5, 2) NULL,
  earned_points DECIMAL(6, 2) NULL,
  total_points DECIMAL(6, 2) NULL,
  passed TINYINT(1) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_attempts_number (assessment_id, user_id, attempt_number),
  KEY idx_assessment_attempts_user (user_id, assessment_id),
  CONSTRAINT fk_assessment_attempts_assessment
    FOREIGN KEY (assessment_id) REFERENCES assessments (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assessment_attempts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  option_id INT UNSIGNED NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_answers_question (attempt_id, question_id),
  KEY idx_assessment_answers_attempt (attempt_id),
  CONSTRAINT fk_assessment_answers_attempt
    FOREIGN KEY (attempt_id) REFERENCES assessment_attempts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assessment_answers_question
    FOREIGN KEY (question_id) REFERENCES assessment_questions (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assessment_answers_option
    FOREIGN KEY (option_id) REFERENCES assessment_options (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Assignments are practical tasks attached to a module. Students submit
-- written work (and optionally a link) as text; no file uploads are required.
CREATE TABLE IF NOT EXISTS assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_id INT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  due_at DATETIME NULL,
  max_points INT UNSIGNED NOT NULL DEFAULT 100,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_module (module_id, is_published),
  CONSTRAINT fk_assignments_module
    FOREIGN KEY (module_id) REFERENCES course_modules (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id INT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  submission_url VARCHAR(2048) NULL,
  status ENUM('submitted', 'graded') NOT NULL DEFAULT 'submitted',
  score DECIMAL(6, 2) NULL,
  feedback TEXT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  graded_at DATETIME NULL,
  graded_by BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assignment_submissions_student (assignment_id, user_id),
  KEY idx_assignment_submissions_user (user_id),
  CONSTRAINT fk_assignment_submissions_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignments (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assignment_submissions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assignment_submissions_grader
    FOREIGN KEY (graded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- PHASE 10 — CERTIFICATES
-- ============================================================
-- A certificate is issued once per student and course after the server
-- confirms that every required lesson, assessment and assignment is complete.
-- The public code lets anyone verify a certificate without signing in.
CREATE TABLE IF NOT EXISTS certificates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  certificate_code VARCHAR(40) NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certificates_code (certificate_code),
  UNIQUE KEY uq_certificates_student_course (user_id, course_id),
  KEY idx_certificates_course (course_id),
  CONSTRAINT fk_certificates_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_certificates_course
    FOREIGN KEY (course_id) REFERENCES courses (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Numbered migration files that have already been applied. The migration
-- runner records each filename once, so `npm run db:migrate` can be repeated
-- safely without re-running data or index changes.
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (filename)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
