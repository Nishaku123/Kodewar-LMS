import { Router } from "express";
import {
  getAssessment,
  getAssessmentAttempt,
  getMyAssessments,
  startAssessmentAttempt,
  submitAssessmentAttempt,
} from "../controllers/assessment.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.get("/", getMyAssessments);
router.get("/:assessmentId", getAssessment);
router.post("/:assessmentId/attempts", startAssessmentAttempt);
router.get("/:assessmentId/attempts/:attemptId", getAssessmentAttempt);
router.post("/:assessmentId/attempts/:attemptId/submit", submitAssessmentAttempt);

export default router;
