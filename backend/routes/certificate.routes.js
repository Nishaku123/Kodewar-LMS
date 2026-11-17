import { Router } from "express";
import {
  downloadMyCertificate,
  downloadVerifiedCertificate,
  getMyCertificates,
  verifyCertificate,
} from "../controllers/certificate.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

/**
 * Public verification is registered before the signed-in student routes so a
 * code can be checked without an account. Certificates themselves are always
 * scoped to the authenticated student.
 */
const certificateRouter = Router();

certificateRouter.get("/verify/:code/download", downloadVerifiedCertificate);
certificateRouter.get("/verify/:code", verifyCertificate);

certificateRouter.get(
  "/:certificateId/download",
  requireAuth,
  requireRole("student"),
  downloadMyCertificate
);
certificateRouter.get("/", requireAuth, requireRole("student"), getMyCertificates);

export default certificateRouter;
