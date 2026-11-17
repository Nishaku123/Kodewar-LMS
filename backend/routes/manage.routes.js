import { Router } from "express";
import { requireAdmin, requireAuth, requireStaff } from "../middleware/auth.js";
import {
  createCourseHandler,
  deleteCourseHandler,
  getCourse,
  listCourses,
  publishCourse,
  unpublishCourse,
  updateCourseHandler,
} from "../controllers/manage.course.controller.js";
import {
  createModuleHandler,
  deleteModuleHandler,
  getModule,
  listModules,
  updateModuleHandler,
} from "../controllers/manage.module.controller.js";
import {
  createLessonHandler,
  deleteLessonHandler,
  getLesson,
  listLessons,
  updateLessonHandler,
} from "../controllers/manage.lesson.controller.js";
import {
  enrollStudent,
  listCourseEnrollments,
  listStudentDirectory,
  removeEnrollment,
} from "../controllers/manage.enrollment.controller.js";
import {
  createAssessmentHandler,
  createOptionHandler,
  createQuestionHandler,
  deleteAssessmentHandler,
  deleteOptionHandler,
  deleteQuestionHandler,
  getAssessmentAttempts,
  getAssessmentManagement,
  listCourseAssessments,
  listModuleAssessments,
  publishAssessment,
  unpublishAssessment,
  updateAssessmentHandler,
  updateOptionHandler,
  updateQuestionHandler,
} from "../controllers/manage.assessment.controller.js";
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  getAssignmentManagement,
  gradeSubmissionHandler,
  listAssignmentSubmissions,
  listCourseAssignments,
  listModuleAssignments,
  publishAssignment,
  unpublishAssignment,
  updateAssignmentHandler,
} from "../controllers/manage.assignment.controller.js";
import {
  getCourseProgressRoster,
  getStudentCourseProgress,
  getStudentProgress,
} from "../controllers/manage.progress.controller.js";
import {
  createManagedUser,
  listUserDirectory,
  updateManagedUserRole,
  updateManagedUserStatus,
} from "../controllers/manage.users.controller.js";

/**
 * Staff/authoring REST API. Every route requires an authenticated trainer or
 * administrator. Destructive, enrolment and user-access routes additionally
 * require an administrator.
 */
const router = Router();

router.use(requireAuth, requireStaff);

/* Courses ------------------------------------------------------------ */
router.get("/courses", listCourses);
router.post("/courses", createCourseHandler);
router.get("/courses/:courseId", getCourse);
router.patch("/courses/:courseId", updateCourseHandler);
router.delete("/courses/:courseId", requireAdmin, deleteCourseHandler);
router.post("/courses/:courseId/publish", publishCourse);
router.post("/courses/:courseId/unpublish", unpublishCourse);

/* Course sub-resources ----------------------------------------------- */
router.get("/courses/:courseId/modules", listModules);
router.post("/courses/:courseId/modules", createModuleHandler);
router.get("/courses/:courseId/assessments", listCourseAssessments);
router.get("/courses/:courseId/assignments", listCourseAssignments);

/* Enrolments --------------------------------------------------------- */
router.get("/courses/:courseId/enrollments", listCourseEnrollments);
router.post("/courses/:courseId/enrollments", requireAdmin, enrollStudent);
router.delete(
  "/courses/:courseId/enrollments/:userId",
  requireAdmin,
  removeEnrollment
);
router.get("/students", listStudentDirectory);

/* Progress ----------------------------------------------------------- */
router.get("/courses/:courseId/progress", getCourseProgressRoster);
router.get(
  "/courses/:courseId/progress/:userId",
  getStudentCourseProgress
);
router.get("/students/:userId/progress", getStudentProgress);

/* Modules ------------------------------------------------------------ */
router.get("/modules/:moduleId", getModule);
router.patch("/modules/:moduleId", updateModuleHandler);
router.delete("/modules/:moduleId", requireAdmin, deleteModuleHandler);
router.get("/modules/:moduleId/lessons", listLessons);
router.post("/modules/:moduleId/lessons", createLessonHandler);
router.get("/modules/:moduleId/assessments", listModuleAssessments);
router.post("/modules/:moduleId/assessments", createAssessmentHandler);
router.get("/modules/:moduleId/assignments", listModuleAssignments);
router.post("/modules/:moduleId/assignments", createAssignmentHandler);

/* Lessons ------------------------------------------------------------ */
router.get("/lessons/:lessonId", getLesson);
router.patch("/lessons/:lessonId", updateLessonHandler);
router.delete("/lessons/:lessonId", requireAdmin, deleteLessonHandler);

/* Assessments -------------------------------------------------------- */
router.get("/assessments/:assessmentId", getAssessmentManagement);
router.patch("/assessments/:assessmentId", updateAssessmentHandler);
router.delete(
  "/assessments/:assessmentId",
  requireAdmin,
  deleteAssessmentHandler
);
router.post("/assessments/:assessmentId/publish", publishAssessment);
router.post("/assessments/:assessmentId/unpublish", unpublishAssessment);
router.get("/assessments/:assessmentId/attempts", getAssessmentAttempts);
router.post(
  "/assessments/:assessmentId/questions",
  createQuestionHandler
);

/* Questions and options ---------------------------------------------- */
router.patch("/questions/:questionId", updateQuestionHandler);
router.delete("/questions/:questionId", requireAdmin, deleteQuestionHandler);
router.post("/questions/:questionId/options", createOptionHandler);
router.patch("/options/:optionId", updateOptionHandler);
router.delete("/options/:optionId", requireAdmin, deleteOptionHandler);

/* Assignments -------------------------------------------------------- */
router.get("/assignments/:assignmentId", getAssignmentManagement);
router.patch("/assignments/:assignmentId", updateAssignmentHandler);
router.delete(
  "/assignments/:assignmentId",
  requireAdmin,
  deleteAssignmentHandler
);
router.post("/assignments/:assignmentId/publish", publishAssignment);
router.post("/assignments/:assignmentId/unpublish", unpublishAssignment);
router.get(
  "/assignments/:assignmentId/submissions",
  listAssignmentSubmissions
);

/* Grading ------------------------------------------------------------ */
router.patch("/submissions/:submissionId/grade", gradeSubmissionHandler);

/* User access (administrator only) ----------------------------------- */
router.get("/users", requireAdmin, listUserDirectory);
router.post("/users", requireAdmin, createManagedUser);
router.patch("/users/:userId/role", requireAdmin, updateManagedUserRole);
router.patch("/users/:userId/status", requireAdmin, updateManagedUserStatus);

export default router;
