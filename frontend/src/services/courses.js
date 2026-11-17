import { apiRequest } from "./api.js";

export function getCourseCatalogueRequest() {
  return apiRequest("/courses/catalog");
}

export function getMyCoursesRequest() {
  return apiRequest("/courses/mine");
}

export function getCourseRequest(courseId) {
  return apiRequest(`/courses/${encodeURIComponent(courseId)}`);
}

export function enrollInCourseRequest(courseId) {
  return apiRequest(`/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: "POST",
  });
}
