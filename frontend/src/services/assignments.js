import { apiRequest } from "./api.js";

export function getAssignmentsRequest() {
  return apiRequest("/assignments");
}

export function getAssignmentRequest(assignmentId) {
  return apiRequest(`/assignments/${encodeURIComponent(assignmentId)}`);
}

export function submitAssignmentRequest(assignmentId, { content, submissionUrl }) {
  return apiRequest(
    `/assignments/${encodeURIComponent(assignmentId)}/submissions`,
    {
      method: "POST",
      body: JSON.stringify({ content, submissionUrl }),
    }
  );
}
