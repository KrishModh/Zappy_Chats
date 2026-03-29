import getCloudinary from '../config/cloudinary.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export const serializeUser = (user, onlineUserIds = new Set()) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  username: user.username,
  profilePic: user.profilePic,
  phone: user.phone,
  gender: user.gender,
  dob: user.dob,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt,
  isOnline: onlineUserIds.has(user._id.toString())
});

export const getProfile = async (userId, onlineUserIds = new Set()) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return serializeUser(user, onlineUserIds);
};

export const updateProfile = async ({ userId, body, file, onlineUserIds = new Set() }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const normalizedUsername = body.username?.trim().toLowerCase();

  if (normalizedUsername && normalizedUsername !== user.username) {
    const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: userId } });
    if (existingUser) {
      throw new ApiError(409, 'Username is already taken.');
    }
  }

  user.fullName = body.fullName || user.fullName;
  user.username = normalizedUsername || user.username;
  user.phone = body.phone || user.phone;
  user.gender = body.gender || user.gender;
  user.dob = body.dob || user.dob;

  if (file) {
    const cloudinary = getCloudinary();
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: 'zappy/profile-pictures',
      resource_type: 'image'
    });
    user.profilePic = uploadResult.secure_url;
  }

  await user.save();
  return serializeUser(user, onlineUserIds);
};

export const searchUsers = async (query, currentUserId, onlineUserIds = new Set()) => {
  if (!query) {
    return [];
  }

  const users = await User.find({
    username: { $regex: query, $options: 'i' },
    _id: { $ne: currentUserId }
  })
    .select('fullName username profilePic lastSeen')
    .limit(15)
    .lean();

  return users.map((user) => ({
    ...user,
    isOnline: onlineUserIds.has(user._id.toString())
  }));
};