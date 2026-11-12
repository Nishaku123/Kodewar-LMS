-- ============================================================
-- 002 — Phase 10 certificates
-- ============================================================
-- Certificates are issued by the API only when the server confirms that a
-- student has completed every required unit in an enrolled course. The unique
-- (user_id, course_id) key makes issuance idempotent, and the public code is
-- used by the verification page without exposing internal IDs.
--
-- This file is applied once by `npm run db:migrate` and recorded in the
-- schema_migrations table. Do not edit an applied migration; add a new one.
-- ============================================================

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
