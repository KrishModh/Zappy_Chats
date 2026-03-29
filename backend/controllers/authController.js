import { asyncHandler } from '../utils/asyncHandler.js';
import {
  changePassword,
  checkUsernameAvailability,
  forgotPassword,
  getSessionUser,
  login,
  logout,
  refreshSession,
  resetPassword,
  sendOtp,
  signup,
  verifyOtp
} from '../services/authService.js';

export const sendOtpController = asyncHandler(async (req, res) => {
  await sendOtp(req.body);
  res.json({ message: 'OTP sent successfully.' });
});

export const checkUsernameAvailabilityController = asyncHandler(async (req, res) => {
  const result = await checkUsernameAvailability(req.query.username || '');
  res.json(result);
});

export const verifyOtpController = asyncHandler(async (req, res) => {
  await verifyOtp(req.body);
  res.json({ message: 'OTP verified successfully.' });
});

export const signupController = asyncHandler(async (req, res) => {
  const session = await signup({ body: req.body, file: req.file, req, res });
  res.status(201).json(session);
});

export const loginController = asyncHandler(async (req, res) => {
  const session = await login({ ...req.body, req, res });
  res.json(session);
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword({ userId: req.auth.userId, ...req.body });
  res.json(result);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);
  res.json(result);
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  res.json(result);
});

export const refreshController = asyncHandler(async (req, res) => {
  const session = await refreshSession({ req, res });
  res.json(session);
});

export const logoutController = asyncHandler(async (req, res) => {
  await logout(req, res);
  res.status(204).send();
});

export const meController = asyncHandler(async (req, res) => {
  const session = await getSessionUser(req.auth.userId);
  res.json(session);
});
