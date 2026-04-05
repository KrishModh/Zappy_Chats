import express from 'express';
import {
  changePasswordController,
  checkUsernameAvailabilityController,
  googleResetPasswordController,
  googleSignupController,
  loginController,
  logoutController,
  meController,
  refreshController
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import { ensureSafeImage, upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  changePasswordValidation,
  googleResetPasswordValidation,
  googleSignupValidation,
  loginValidation,
  usernameAvailabilityValidation
} from '../validators/authValidators.js';

const router = express.Router();

// ── Google Signup ──────────────────────────────────────────────────────────────
router.post(
  '/google-signup',
  authLimiter,
  upload.single('profilePic'),
  ensureSafeImage,
  googleSignupValidation,
  validateRequest,
  googleSignupController
);

// ── Google Reset Password (replaces OTP forgot-password flow) ─────────────────
router.post(
  '/google-reset-password',
  authLimiter,
  googleResetPasswordValidation,
  validateRequest,
  googleResetPasswordController
);

// ── Username check ─────────────────────────────────────────────────────────────
router.get(
  '/username-availability',
  usernameAvailabilityValidation,
  validateRequest,
  checkUsernameAvailabilityController
);

// ── Login ──────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidation, validateRequest, loginController);

// ── Protected ──────────────────────────────────────────────────────────────────
router.post('/change-password', requireAuth, changePasswordValidation, validateRequest, changePasswordController);
router.post('/refresh', refreshController);
router.post('/logout',  logoutController);
router.get('/me',       requireAuth, meController);

export default router;