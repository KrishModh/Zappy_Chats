import bcrypt from 'bcrypt';
import getCloudinary from '../config/cloudinary.js';
import OtpVerification from '../models/OtpVerification.js';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../utils/sendOtpEmail.js';
import {
  accessCookieOptions,
  hashToken,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  signSocketToken,
  verifyRefreshToken
} from '../utils/tokens.js';

const refreshDuration = Number(process.env.REFRESH_TOKEN_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);
const otpDuration = Number(process.env.OTP_MAX_AGE_MS || 5 * 60 * 1000);
const maxOtpAttempts = Number(process.env.MAX_OTP_ATTEMPTS || 5);

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

const hashPassword = (password) => bcrypt.hash(password, Math.max(10, Number(process.env.BCRYPT_SALT_ROUNDS || 12)));

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

const upsertOtp = async ({ email, purpose }) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + otpDuration);

  await OtpVerification.findOneAndUpdate(
    { email, purpose },
    { $set: { otp: String(otp), purpose, expiresAt, verifiedAt: null, attempts: 0 } },
    { upsert: true, new: true }
  );

  await sendOtpEmail(email, String(otp));
};

const getOtpRecord = async (email, purpose) => OtpVerification.findOne({ email, purpose });

export const sendOtp = async ({ email, purpose = 'signup' }) => {
  if (purpose === 'signup') {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'Email is already in use.');
    }
  }

  await upsertOtp({ email, purpose });
};

export const checkUsernameAvailability = async (username) => {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    throw new ApiError(400, 'Username is required.');
  }

  const existing = await User.findOne({ username: normalizedUsername }).select('_id');
  return { available: !existing };
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (user) {
    await upsertOtp({ email, purpose: 'password_reset' });
  }

  return { message: 'If an account exists for that email, an OTP has been sent.' };
};

export const verifyOtp = async ({ email, otp, purpose = 'signup' }) => {
  const record = await getOtpRecord(email, purpose);

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'OTP expired. Please request a new code.');
  }

  if (record.attempts >= maxOtpAttempts) {
    throw new ApiError(429, 'Too many OTP attempts. Please request a new code.');
  }

  if (record.otp !== String(otp)) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'OTP is invalid.');
  }

  record.verifiedAt = new Date();
  await record.save();
};

export const signup = async ({ body, file, req, res }) => {
  const { fullName, email, username, password, phone, gender, dob, otp } = body;
  const normalizedUsername = username.trim().toLowerCase();
  const otpRecord = await getOtpRecord(email, 'signup');

  if (!otpRecord || otpRecord.expiresAt < new Date() || otpRecord.otp !== String(otp)) {
    throw new ApiError(400, 'OTP verification failed.');
  }

  if (!otpRecord.verifiedAt) {
    throw new ApiError(400, 'Please verify OTP before completing signup.');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username: normalizedUsername }] });
  if (existingUser) {
    throw new ApiError(409, 'A user with that email or username already exists.');
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
    fullName,
    email,
    username: normalizedUsername,
    password: await hashPassword(password),
    profilePic,
    phone,
    gender,
    dob
  });

  await OtpVerification.deleteOne({ email, purpose: 'signup' });
  return issueSession(res, user, req);
};

export const login = async ({ username, password, req, res }) => {
  const user = await User.findOne({ username: username.trim().toLowerCase() });

  if (!user) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  return issueSession(res, user, req);
};

export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Old password is incorrect.');
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password updated successfully.' };
};

export const resetPassword = async ({ email, newPassword, confirmPassword }) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match.');
  }

  const record = await getOtpRecord(email, 'password_reset');
  if (!record || record.expiresAt < new Date() || !record.verifiedAt) {
    throw new ApiError(400, 'OTP verification required before password reset.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, 'Unable to reset password.');
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  await OtpVerification.deleteOne({ email, purpose: 'password_reset' });

  return { message: 'Password reset successfully.' };
};

export const refreshSession = async ({ req, res }) => {
  const refreshToken = req.cookies?.zappy_refresh;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing.');
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Refresh token is invalid.');
  }

  const storedToken = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) }).populate('user');
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token has expired.');
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });
  return issueSession(res, storedToken.user, req);
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.zappy_refresh;

  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }

  res.clearCookie('zappy_access', accessCookieOptions);
  res.clearCookie('zappy_refresh', refreshCookieOptions);
};

export const getSessionUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return {
    user: sanitizeUser(user),
    socketToken: signSocketToken({ userId: user._id, username: user.username })
  };
};