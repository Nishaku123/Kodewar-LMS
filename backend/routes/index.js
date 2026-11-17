import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import courseRoutes from "./course.routes.js";
import assessmentRoutes from "./assessment.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import certificateRoutes from "./certificate.routes.js";
import manageRoutes from "./manage.routes.js";
import {
  lessonRouter as lessonRoutes,
  moduleRouter as moduleRoutes,
  progressRouter,
} from "./progress.routes.js";

/**
 * All API modules are mounted here.
 */
const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/certificates", certificateRoutes);
router.use("/manage", manageRoutes);
router.use("/progress", progressRouter);
router.use("/lessons", lessonRoutes);
router.use("/modules", moduleRoutes);

export default router;
