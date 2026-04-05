import { asyncHandler } from '../utils/asyncHandler.js';
import {
  changePassword,
  checkUsernameAvailability,
  getSessionUser,
  googleResetPassword,
  googleSignup,
  login,
  logout,
  refreshSession
} from '../services/authService.js';

// ── Google Signup ──────────────────────────────────────────────────────────────
export const googleSignupController = asyncHandler(async (req, res) => {
  const session = await googleSignup({
    idToken: req.body.idToken,
    body: req.body,
    file: req.file,
    req,
    res
  });
  res.status(201).json(session);
});

// ── Google Reset Password ──────────────────────────────────────────────────────
export const googleResetPasswordController = asyncHandler(async (req, res) => {
  const result = await googleResetPassword(req.body);
  res.json(result);
});

// ── Username check ─────────────────────────────────────────────────────────────
export const checkUsernameAvailabilityController = asyncHandler(async (req, res) => {
  const result = await checkUsernameAvailability(req.query.username || '');
  res.json(result);
});

// ── Login ──────────────────────────────────────────────────────────────────────
export const loginController = asyncHandler(async (req, res) => {
  const session = await login({ ...req.body, req, res });
  res.json(session);
});

// ── Change Password (profile page) ────────────────────────────────────────────
export const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword({ userId: req.auth.userId, ...req.body });
  res.json(result);
});

// ── Session ────────────────────────────────────────────────────────────────────
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