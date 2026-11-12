import { apiRequest } from "./api.js";

export function getAssessmentsRequest() {
  return apiRequest("/assessments");
}

export function getAssessmentRequest(assessmentId) {
  return apiRequest(`/assessments/${encodeURIComponent(assessmentId)}`);
}

export function startAssessmentAttemptRequest(assessmentId) {
  return apiRequest(
    `/assessments/${encodeURIComponent(assessmentId)}/attempts`,
    { method: "POST" }
  );
}

export function submitAssessmentAttemptRequest(assessmentId, attemptId, answers) {
  return apiRequest(
    `/assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    }
  );
}

export function getAssessmentAttemptRequest(assessmentId, attemptId) {
  return apiRequest(
    `/assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}`
  );
}
