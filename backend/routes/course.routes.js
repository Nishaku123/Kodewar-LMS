import { Router } from "express";
import {
  enrollInCourse,
  getCourseCatalogue,
  getCourseDetails,
  getMyCourses,
} from "../controllers/course.controller.js";
import { getCourseModules } from "../controllers/progress.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("student"));
router.get("/catalog", getCourseCatalogue);
router.get("/mine", getMyCourses);
router.post("/:courseId/enroll", enrollInCourse);
router.get("/:courseId/modules", getCourseModules);
router.get("/:courseId", getCourseDetails);

export default router;
