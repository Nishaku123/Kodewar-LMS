import { randomBytes } from "node:crypto";
import { listEnrolledCoursesForStudent } from "../models/course.model.js";
import {
  createCertificate,
  findCertificateByCode,
  listCertificateCourseIds,
  listCertificatesForStudent,
} from "../models/certificate.model.js";
import { getCourseProgress } from "./progress.service.js";

/**
 * Certificate rules.
 *
 * A certificate is issued automatically only after `getCourseProgress` reports
 * that every required unit in the course is complete. That service is the
 * same one used by lessons, assessments and assignments, so there is no
 * separate definition of "finished" that could drift.
 */

const CODE_PATTERN = /^KDW-[A-F0-9]{16}$/;

function generateCode() {
  return `KDW-${randomBytes(8).toString("hex").toUpperCase()}`;
}

/**
 * Checks each enrolled course that does not already have a certificate and
 * issues one when the course is complete. Suitable for calling from the
 * student certificate list; it is idempotent.
 */
export async function issueEligibleCertificates(userId) {
  const [enrolledCourses, existingCourseIds] = await Promise.all([
    listEnrolledCoursesForStudent(userId),
    listCertificateCourseIds(userId),
  ]);

  for (const course of enrolledCourses) {
    if (existingCourseIds.has(course.id)) continue;

    const { summary } = await getCourseProgress(course.id, userId);

    if (!summary.isComplete) continue;

    // A random-code collision is extremely unlikely, but retrying keeps the
    // endpoint reliable if one ever happens.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const certificate = await createCertificate(
        userId,
        course.id,
        generateCode()
      );

      if (certificate) break;
    }
  }
}

export async function getStudentCertificates(userId) {
  await issueEligibleCertificates(userId);
  return listCertificatesForStudent(userId);
}

export function normalizeCertificateCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export async function verifyCertificateCode(value) {
  const code = normalizeCertificateCode(value);

  if (!code) return null;

  return findCertificateByCode(code);
}
