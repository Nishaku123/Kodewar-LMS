import { Router } from "express";
import {
  completeLesson,
  getCourseModules,
  getCourseProgressDetails,
  getLessonDetails,
  getModuleDetails,
  getMyProgress,
  uncompleteLesson,
} from "../controllers/progress.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const progressRouter = Router();
progressRouter.use(requireAuth, requireRole("student"));
progressRouter.get("/", getMyProgress);
progressRouter.get("/courses/:courseId", getCourseProgressDetails);

const lessonRouter = Router();
lessonRouter.use(requireAuth, requireRole("student"));
lessonRouter.get("/:lessonId", getLessonDetails);
lessonRouter.post("/:lessonId/complete", completeLesson);
lessonRouter.delete("/:lessonId/complete", uncompleteLesson);

const moduleRouter = Router();
moduleRouter.use(requireAuth, requireRole("student"));
moduleRouter.get("/:moduleId", getModuleDetails);

export { progressRouter, lessonRouter, moduleRouter };
