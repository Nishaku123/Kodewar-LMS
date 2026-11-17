import {
  listAssessmentProgress,
  listAssignmentProgress,
  listCourseStructure,
  listLessonCompletionIds,
} from "../models/progress.model.js";
import { listEnrollmentsForCourse } from "../models/enrollment.model.js";

/**
 * Business rules for unlocks and progress.
 *
 * A module is unlocked when every earlier module is complete. A module is
 * complete when all of its lessons are completed, every published assessment
 * has been passed and every published assignment has been submitted.
 * Assessments and assignments only unlock once that module's lessons are done.
 *
 * These rules run on the server for every request. The React UI only mirrors
 * them; hiding a button is never treated as security.
 */

function roundPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export async function getCourseProgress(courseId, userId) {
  const [modules, completedLessonIds, assessmentProgress, assignmentProgress] =
    await Promise.all([
      listCourseStructure(courseId),
      listLessonCompletionIds(userId, courseId),
      listAssessmentProgress(userId, courseId),
      listAssignmentProgress(userId, courseId),
    ]);

  let previousModuleComplete = true;

  const enrichedModules = modules.map((module) => {
    const moduleContext = {
      moduleId: module.id,
      moduleTitle: module.title,
      weekNumber: module.weekNumber,
    };

    const lessons = module.lessons.map((lesson) => {
      // Lesson media is never sent for a locked module: the unlock rule is a
      // server-side rule, not just a hidden button in the browser.
      const isUnlocked = previousModuleComplete;

      return {
        ...lesson,
        ...(isUnlocked
          ? {}
          : { videoProvider: null, videoUrl: null }),
        ...moduleContext,
        isCompleted: completedLessonIds.has(lesson.id),
        isUnlocked,
      };
    });

    const lessonsComplete = lessons.every((lesson) => lesson.isCompleted);
    const activitiesUnlocked = previousModuleComplete && lessonsComplete;

    const assessments = module.assessments.map((assessment) => {
      const progress = assessmentProgress.get(assessment.id);

      return {
        ...assessment,
        ...moduleContext,
        attemptsUsed: progress?.attemptsUsed ?? 0,
        bestScore: progress?.bestScore ?? null,
        passed: Boolean(progress?.passed),
        lastAttemptAt: progress?.lastAttemptAt ?? null,
        isUnlocked: activitiesUnlocked,
        isCompleted: Boolean(progress?.passed),
      };
    });

    const assignments = module.assignments.map((assignment) => {
      const submission = assignmentProgress.get(assignment.id) || null;

      return {
        ...assignment,
        ...moduleContext,
        submission,
        isUnlocked: activitiesUnlocked,
        isCompleted: Boolean(submission),
      };
    });

    const assessmentsPassed = assessments.every(
      (assessment) => assessment.isCompleted
    );
    const assignmentsSubmitted = assignments.every(
      (assignment) => assignment.isCompleted
    );
    const isCompleted =
      lessonsComplete && assessmentsPassed && assignmentsSubmitted;

    const enriched = {
      ...module,
      lessons,
      assessments,
      assignments,
      isUnlocked: previousModuleComplete,
      isCompleted,
      progressPercent: roundPercent(
        lessons.filter((lesson) => lesson.isCompleted).length +
          assessments.filter((assessment) => assessment.isCompleted).length +
          assignments.filter((assignment) => assignment.isCompleted).length,
        lessons.length + assessments.length + assignments.length
      ),
    };

    previousModuleComplete = isCompleted;

    return enriched;
  });

  const summary = buildSummary(enrichedModules);

  return { modules: enrichedModules, summary };
}

function buildSummary(modules) {
  const lessons = modules.flatMap((module) => module.lessons);
  const assessments = modules.flatMap((module) => module.assessments);
  const assignments = modules.flatMap((module) => module.assignments);

  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
  const passedAssessments = assessments.filter(
    (assessment) => assessment.isCompleted
  ).length;
  const submittedAssignments = assignments.filter(
    (assignment) => assignment.isCompleted
  ).length;

  const totalUnits = lessons.length + assessments.length + assignments.length;
  const completedUnits =
    completedLessons + passedAssessments + submittedAssignments;

  const nextLesson =
    lessons.find((lesson) => lesson.isUnlocked && !lesson.isCompleted) || null;
  const nextAssessment =
    assessments.find(
      (assessment) => assessment.isUnlocked && !assessment.isCompleted
    ) || null;
  const nextAssignment =
    assignments.find(
      (assignment) => assignment.isUnlocked && !assignment.isCompleted
    ) || null;

  const nextAction = nextLesson
    ? { type: "lesson", id: nextLesson.id, title: nextLesson.title }
    : nextAssessment
      ? {
          type: "assessment",
          id: nextAssessment.id,
          title: nextAssessment.title,
        }
      : nextAssignment
        ? {
            type: "assignment",
            id: nextAssignment.id,
            title: nextAssignment.title,
          }
        : null;

  const scoredAssessments = assessments.filter(
    (assessment) => assessment.bestScore !== null
  );
  const averageAssessmentScore = scoredAssessments.length
    ? Math.round(
        (scoredAssessments.reduce(
          (total, assessment) => total + Number(assessment.bestScore),
          0
        ) /
          scoredAssessments.length) *
          10
      ) / 10
    : null;

  return {
    modulesTotal: modules.length,
    modulesCompleted: modules.filter((module) => module.isCompleted).length,
    lessonCount: lessons.length,
    completedLessons,
    assessmentCount: assessments.length,
    passedAssessments,
    assignmentCount: assignments.length,
    submittedAssignments,
    totalUnits,
    completedUnits,
    progressPercent: roundPercent(completedUnits, totalUnits),
    averageAssessmentScore,
    isComplete: modules.length > 0 && modules.every((module) => module.isCompleted),
    nextLesson: nextLesson
      ? {
          id: nextLesson.id,
          title: nextLesson.title,
          moduleId: nextLesson.moduleId,
          moduleTitle: nextLesson.moduleTitle,
          weekNumber: nextLesson.weekNumber,
        }
      : null,
    nextAction,
  };
}

/**
 * Finds one assessment in a course while keeping its unlock state. Returns
 * null when the assessment is not part of the course.
 */
export function findAssessmentInModules(modules, assessmentId) {
  for (const module of modules) {
    const assessment = module.assessments.find(
      (item) => item.id === assessmentId
    );

    if (assessment) {
      return { module, assessment };
    }
  }

  return null;
}

export function findAssignmentInModules(modules, assignmentId) {
  for (const module of modules) {
    const assignment = module.assignments.find(
      (item) => item.id === assignmentId
    );

    if (assignment) {
      return { module, assignment };
    }
  }

  return null;
}

export function findLessonInModules(modules, lessonId) {
  for (const module of modules) {
    const lesson = module.lessons.find((item) => item.id === lessonId);

    if (lesson) {
      return { module, lesson };
    }
  }

  return null;
}

/**
 * Staff view: every enrolled student's derived progress for one course.
 * Progress is calculated with the same rules students see.
 */
export async function getCourseRosterProgress(courseId) {
  const enrollments = await listEnrollmentsForCourse(courseId);
  const students = [];

  for (const enrollment of enrollments) {
    const { summary } = await getCourseProgress(courseId, enrollment.userId);
    students.push({ ...enrollment, progress: summary });
  }

  const completed = students.filter(
    (student) => student.progress.isComplete
  ).length;
  const averageProgress = students.length
    ? Math.round(
        (students.reduce(
          (total, student) => total + student.progress.progressPercent,
          0
        ) /
          students.length) *
          10
      ) / 10
    : 0;

  return {
    students,
    summary: {
      enrolled: students.length,
      completed,
      averageProgress,
    },
  };
}
