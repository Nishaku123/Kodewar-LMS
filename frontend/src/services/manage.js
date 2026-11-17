import { apiRequest } from "./api.js";

/**
 * All staff/authoring API calls live here. The matching Express routes are
 * mounted at /api/manage and require a trainer or admin account.
 */

function queryString(params = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/* Courses ------------------------------------------------------------- */

export function getManagedCoursesRequest(params) {
  return apiRequest(`/manage/courses${queryString(params)}`);
}

export function getManagedCourseRequest(courseId) {
  return apiRequest(`/manage/courses/${encodeURIComponent(courseId)}`);
}

export function createManagedCourseRequest(data) {
  return apiRequest("/manage/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateManagedCourseRequest(courseId, data) {
  return apiRequest(`/manage/courses/${encodeURIComponent(courseId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteManagedCourseRequest(courseId) {
  return apiRequest(`/manage/courses/${encodeURIComponent(courseId)}`, {
    method: "DELETE",
  });
}

export function setManagedCoursePublishedRequest(courseId, isPublished) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/${
      isPublished ? "publish" : "unpublish"
    }`,
    { method: "POST" }
  );
}

/* Modules ------------------------------------------------------------- */

export function getCourseModulesRequest(courseId) {
  return apiRequest(`/manage/courses/${encodeURIComponent(courseId)}/modules`);
}

export function getModuleRequest(moduleId) {
  return apiRequest(`/manage/modules/${encodeURIComponent(moduleId)}`);
}

export function createModuleRequest(courseId, data) {
  return apiRequest(`/manage/courses/${encodeURIComponent(courseId)}/modules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateModuleRequest(moduleId, data) {
  return apiRequest(`/manage/modules/${encodeURIComponent(moduleId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteModuleRequest(moduleId) {
  return apiRequest(`/manage/modules/${encodeURIComponent(moduleId)}`, {
    method: "DELETE",
  });
}

/* Lessons ------------------------------------------------------------- */

export function getModuleLessonsRequest(moduleId) {
  return apiRequest(`/manage/modules/${encodeURIComponent(moduleId)}/lessons`);
}

export function createLessonRequest(moduleId, data) {
  return apiRequest(
    `/manage/modules/${encodeURIComponent(moduleId)}/lessons`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function getLessonRequest(lessonId) {
  return apiRequest(`/manage/lessons/${encodeURIComponent(lessonId)}`);
}

export function updateLessonRequest(lessonId, data) {
  return apiRequest(`/manage/lessons/${encodeURIComponent(lessonId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteLessonRequest(lessonId) {
  return apiRequest(`/manage/lessons/${encodeURIComponent(lessonId)}`, {
    method: "DELETE",
  });
}

/* Assessments --------------------------------------------------------- */

export function getCourseAssessmentsRequest(courseId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/assessments`
  );
}

export function getModuleAssessmentsRequest(moduleId) {
  return apiRequest(
    `/manage/modules/${encodeURIComponent(moduleId)}/assessments`
  );
}

export function getManagedAssessmentRequest(assessmentId) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}`
  );
}

export function createAssessmentRequest(moduleId, data) {
  return apiRequest(
    `/manage/modules/${encodeURIComponent(moduleId)}/assessments`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateAssessmentRequest(assessmentId, data) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export function deleteAssessmentRequest(assessmentId) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}`,
    { method: "DELETE" }
  );
}

export function setAssessmentPublishedRequest(assessmentId, isPublished) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}/${
      isPublished ? "publish" : "unpublish"
    }`,
    { method: "POST" }
  );
}

export function getAssessmentAttemptsRequest(assessmentId) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}/attempts`
  );
}

export function createQuestionRequest(assessmentId, data) {
  return apiRequest(
    `/manage/assessments/${encodeURIComponent(assessmentId)}/questions`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateQuestionRequest(questionId, data) {
  return apiRequest(`/manage/questions/${encodeURIComponent(questionId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteQuestionRequest(questionId) {
  return apiRequest(`/manage/questions/${encodeURIComponent(questionId)}`, {
    method: "DELETE",
  });
}

export function createOptionRequest(questionId, data) {
  return apiRequest(
    `/manage/questions/${encodeURIComponent(questionId)}/options`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateOptionRequest(optionId, data) {
  return apiRequest(`/manage/options/${encodeURIComponent(optionId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteOptionRequest(optionId) {
  return apiRequest(`/manage/options/${encodeURIComponent(optionId)}`, {
    method: "DELETE",
  });
}

/* Assignments --------------------------------------------------------- */

export function getCourseAssignmentsRequest(courseId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/assignments`
  );
}

export function getModuleAssignmentsRequest(moduleId) {
  return apiRequest(
    `/manage/modules/${encodeURIComponent(moduleId)}/assignments`
  );
}

export function getManagedAssignmentRequest(assignmentId) {
  return apiRequest(
    `/manage/assignments/${encodeURIComponent(assignmentId)}`
  );
}

export function createAssignmentRequest(moduleId, data) {
  return apiRequest(
    `/manage/modules/${encodeURIComponent(moduleId)}/assignments`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function updateAssignmentRequest(assignmentId, data) {
  return apiRequest(
    `/manage/assignments/${encodeURIComponent(assignmentId)}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export function deleteAssignmentRequest(assignmentId) {
  return apiRequest(
    `/manage/assignments/${encodeURIComponent(assignmentId)}`,
    { method: "DELETE" }
  );
}

export function setAssignmentPublishedRequest(assignmentId, isPublished) {
  return apiRequest(
    `/manage/assignments/${encodeURIComponent(assignmentId)}/${
      isPublished ? "publish" : "unpublish"
    }`,
    { method: "POST" }
  );
}

export function getAssignmentSubmissionsRequest(assignmentId) {
  return apiRequest(
    `/manage/assignments/${encodeURIComponent(assignmentId)}/submissions`
  );
}

export function gradeSubmissionRequest(submissionId, data) {
  return apiRequest(
    `/manage/submissions/${encodeURIComponent(submissionId)}/grade`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

/* Enrolments and progress --------------------------------------------- */

export function getCourseEnrollmentsRequest(courseId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/enrollments`
  );
}

export function getStudentDirectoryRequest(search = "") {
  return apiRequest(`/manage/students${queryString({ search })}`);
}

export function enrollStudentRequest(courseId, data) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/enrollments`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function removeEnrollmentRequest(courseId, userId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(
      userId
    )}`,
    { method: "DELETE" }
  );
}

export function getCourseRosterProgressRequest(courseId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/progress`
  );
}

export function getStudentCourseProgressRequest(courseId, userId) {
  return apiRequest(
    `/manage/courses/${encodeURIComponent(courseId)}/progress/${encodeURIComponent(
      userId
    )}`
  );
}

export function getStudentProgressRequest(userId) {
  return apiRequest(
    `/manage/students/${encodeURIComponent(userId)}/progress`
  );
}

/* User access management (admin only) -------------------------------- */

export function getUserDirectoryRequest(search = "") {
  return apiRequest(`/manage/users${queryString({ search })}`);
}

export function createManagedUserRequest(data) {
  return apiRequest("/manage/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUserRoleRequest(userId, role) {
  return apiRequest(`/manage/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateUserStatusRequest(userId, status) {
  return apiRequest(`/manage/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

