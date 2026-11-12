import { apiRequest } from "./api.js";

export function getProgressRequest() {
  return apiRequest("/progress");
}

export function getCourseProgressRequest(courseId) {
  return apiRequest(`/progress/courses/${encodeURIComponent(courseId)}`);
}

export function completeLessonRequest(lessonId) {
  return apiRequest(`/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: "POST",
  });
}

export function uncompleteLessonRequest(lessonId) {
  return apiRequest(`/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: "DELETE",
  });
}
