import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword,
  updateCurrentUser,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Authentication endpoints.
 *
 * Flow:
 *   POST  /api/auth/register          create a student account
 *   POST  /api/auth/login             sign in and set the httpOnly cookie
 *   POST  /api/auth/logout            clear the cookie
 *   GET   /api/auth/me                restore the session on page load
 *   PATCH /api/auth/me                update the signed-in user's name
 *   PATCH /api/auth/password          change the signed-in user's password
 *   POST  /api/auth/forgot-password   create a reset link
 *   POST  /api/auth/reset-password    use a reset link
 */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait and try again.",
  },
});

// Successful sign-ins do not count towards the limit, so normal use is not
// punished while repeated failed guesses are slowed down.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please wait 15 minutes and try again.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many accounts created from this address. Try again later.",
  },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please wait and try again.",
  },
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", authLimiter, requireAuth, updateCurrentUser);
router.patch("/password", authLimiter, requireAuth, changePassword);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/reset-password", resetLimiter, resetPassword);

export default router;
