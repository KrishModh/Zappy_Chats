import express from 'express';
import {
  changePasswordController,
  checkUsernameAvailabilityController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  resetPasswordController,
  sendOtpController,
  signupController,
  verifyOtpController
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import { ensureSafeImage, upload } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  changePasswordValidation,
  forgotPasswordValidation,
  loginValidation,
  resetPasswordValidation,
  sendOtpValidation,
  signupValidation,
  usernameAvailabilityValidation,
  verifyOtpValidation
} from '../validators/authValidators.js';

const router = express.Router();

router.post('/send-otp', authLimiter, sendOtpValidation, validateRequest, sendOtpController);
router.get('/username-availability', usernameAvailabilityValidation, validateRequest, checkUsernameAvailabilityController);
router.post('/verify-otp', authLimiter, verifyOtpValidation, validateRequest, verifyOtpController);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validateRequest, forgotPasswordController);
router.post('/reset-password', authLimiter, resetPasswordValidation, validateRequest, resetPasswordController);
router.post(
  '/signup',
  authLimiter,
  upload.single('profilePic'),
  ensureSafeImage,
  signupValidation,
  validateRequest,
  signupController
);
router.post('/login', authLimiter, loginValidation, validateRequest, loginController);
router.post('/change-password', requireAuth, changePasswordValidation, validateRequest, changePasswordController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/me', requireAuth, meController);

export default router;
