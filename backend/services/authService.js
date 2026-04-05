import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import getCloudinary from '../config/cloudinary.js';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import {
  accessCookieOptions,
  hashToken,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  signSocketToken,
  verifyRefreshToken
} from '../utils/tokens.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const refreshDuration = Number(process.env.REFRESH_TOKEN_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);

// ─── helpers ──────────────────────────────────────────────────────────────────

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  profilePic: user.profilePic,
  phone: user.phone,
  gender: user.gender,
  dob: user.dob,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt
});

const hashPassword = (password) =>
  bcrypt.hash(password, Math.max(10, Number(process.env.BCRYPT_SALT_ROUNDS || 12)));

const issueSession = async (res, user, req) => {
  const accessToken = signAccessToken({ userId: user._id, username: user.username });
  const refreshToken = signRefreshToken({ userId: user._id });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshDuration),
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip
  });

  res.cookie('zappy_access', accessToken, accessCookieOptions);
  res.cookie('zappy_refresh', refreshToken, refreshCookieOptions);

  return {
    user: sanitizeUser(user),
    socketToken: signSocketToken({ userId: user._id, username: user.username })
  };
};

// Reusable Google token verifier
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Google token verification failed. Please try again.');
  }
};

// ─── exported services ────────────────────────────────────────────────────────

export const checkUsernameAvailability = async (username) => {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) throw new ApiError(400, 'Username is required.');

  const existing = await User.findOne({ username: normalizedUsername }).select('_id');
  return { available: !existing };
};

// ── Google Signup ──────────────────────────────────────────────────────────────
export const googleSignup = async ({ idToken, body, file, req, res }) => {
  const googlePayload = await verifyGoogleToken(idToken);
  const { email, name: googleFullName, sub: googleId } = googlePayload;

  const { username, password, phone, gender, dob, fullName } = body;
  const normalizedUsername = username.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email }, { username: normalizedUsername }]
  });
  if (existingUser) {
    throw new ApiError(
      409,
      existingUser.email === email
        ? 'An account with this Google email already exists. Please log in.'
        : 'That username is already taken.'
    );
  }

  let profilePic = '';
  if (file) {
    const cloudinary = getCloudinary();
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'zappy/profile-pictures',
      resource_type: 'image'
    });
    profilePic = uploadResult.secure_url;
  }

  const user = await User.create({
    fullName: fullName || googleFullName,
    email,
    username: normalizedUsername,
    password: password ? await hashPassword(password) : null,
    googleId,
    profilePic,
    phone,
    gender,
    dob
  });

  return issueSession(res, user, req);
};

// ── Google Reset Password ──────────────────────────────────────────────────────
/**
 * No OTP, no SMTP.
 * Google token = identity proof → find user by email → update password.
 */
export const googleResetPassword = async ({ idToken, newPassword, confirmPassword }) => {
  if (newPassword !== confirmPassword)
    throw new ApiError(400, 'Passwords do not match.');

  const { email } = await verifyGoogleToken(idToken);

  const user = await User.findOne({ email });
  if (!user)
    throw new ApiError(404, 'No Zappy account found for this Google email.');

  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password reset successfully. You can now log in.' };
};

// ── Normal Login ───────────────────────────────────────────────────────────────
export const login = async ({ username, password, req, res }) => {
  const user = await User.findOne({ username: username.trim().toLowerCase() });
  if (!user) throw new ApiError(401, 'Invalid username or password.');

  if (!user.password)
    throw new ApiError(401, 'This account uses Google sign-in. Please log in with Google.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid username or password.');

  return issueSession(res, user, req);
};

// ── Change Password (profile page — old password verify, no Google/OTP) ────────
export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Old password is incorrect.');

  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password updated successfully.' };
};

// ── Session management ─────────────────────────────────────────────────────────
export const refreshSession = async ({ req, res }) => {
  const refreshToken = req.cookies?.zappy_refresh;
  if (!refreshToken) throw new ApiError(401, 'Refresh token is missing.');

  try { verifyRefreshToken(refreshToken); }
  catch { throw new ApiError(401, 'Refresh token is invalid.'); }

  const storedToken = await RefreshToken
    .findOne({ tokenHash: hashToken(refreshToken) })
    .populate('user');

  if (!storedToken || storedToken.expiresAt < new Date())
    throw new ApiError(401, 'Refresh token has expired.');

  await RefreshToken.deleteOne({ _id: storedToken._id });
  return issueSession(res, storedToken.user, req);
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.zappy_refresh;
  if (refreshToken) await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });

  res.clearCookie('zappy_access', accessCookieOptions);
  res.clearCookie('zappy_refresh', refreshCookieOptions);
};

export const getSessionUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  return {
    user: sanitizeUser(user),
    socketToken: signSocketToken({ userId: user._id, username: user.username })
  };
};