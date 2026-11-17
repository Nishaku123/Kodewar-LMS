import { Router } from "express";
import {
  getAssignment,
  getMyAssignments,
  submitAssignment,
} from "../controllers/assignment.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));

router.get("/", getMyAssignments);
router.get("/:assignmentId", getAssignment);
router.post("/:assignmentId/submissions", submitAssignment);

export default router;
