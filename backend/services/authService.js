import bcrypt from 'bcrypt';
import getCloudinary from '../config/cloudinary.js'; // same line, same name
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

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  profilePic: user.profilePic,
  phone: user.phone,
  gender: user.gender,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt
});

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

export const sendOtp = async ({ email }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already in use.');
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { email },
    { $set: { otp: String(otp), expiresAt, verifiedAt: null, attempts: 0 } }, // 👈 $set add kiya, String() wrap kiya
    { upsert: true, new: true }
  );

  await sendOtpEmail(email, String(otp)); // 👈 String() wrap
};

export const verifyOtp = async ({ email, otp }) => {
  const record = await OtpVerification.findOne({ email });

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'OTP expired. Please request a new code.');
  }

  if (record.otp !== String(otp)) { // 👈 String() add kiya
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'OTP is invalid.');
  }

  record.verifiedAt = new Date();
  await record.save();
};

export const signup = async ({ body, file, req, res }) => {
  const { fullName, email, username, password, phone, gender, otp } = body;
  const otpRecord = await OtpVerification.findOne({ email });

  if (!otpRecord || otpRecord.expiresAt < new Date() || otpRecord.otp !== otp) {
    throw new ApiError(400, 'OTP verification failed.');
  }

  if (!otpRecord.verifiedAt) {
    throw new ApiError(400, 'Please verify OTP before completing signup.');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, 'A user with that email or username already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, Math.max(10, Number(process.env.BCRYPT_SALT_ROUNDS || 12)));
  let profilePic = '';

  if (file) {
    const cloudinary = getCloudinary(); // 👈 ye add karo
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
    username,
    password: hashedPassword,
    profilePic,
    phone,
    gender
  });

  await OtpVerification.deleteOne({ email });
  return issueSession(res, user, req);
};

export const login = async ({ username, password, req, res }) => {
  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  return issueSession(res, user, req);
};

export const refreshSession = async ({ req, res }) => {
  const refreshToken = req.cookies?.zappy_refresh;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is missing.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Refresh token is invalid.');
  }

  const storedToken = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) }).populate('user');
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token has expired.');
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });
  return issueSession(res, storedToken.user, req || { ip: '', get: () => '' }, decoded.userId);
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
