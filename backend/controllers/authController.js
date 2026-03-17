import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import OtpVerification from '../models/OtpVerification.js';
import User from '../models/User.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../utils/sendOtpEmail.js';

const getToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpVerification.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true });
  await sendOtpEmail(email, otp);

  return res.json({ message: 'OTP sent successfully' });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = await OtpVerification.findOne({ email });

  if (!record || record.expiresAt < new Date() || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  return res.json({ message: 'OTP verified' });
};

export const signup = async (req, res) => {
  const { fullName, email, username, password, phone, gender, otp } = req.body;

  if (!fullName || !email || !username || !password || !phone || !gender || !otp) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const record = await OtpVerification.findOne({ email });
  if (!record || record.expiresAt < new Date() || record.otp !== otp) {
    return res.status(400).json({ message: 'OTP verification failed' });
  }

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) return res.status(409).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  let profilePic = '';

  if (req.file) {
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploaded = await cloudinary.uploader.upload(base64, { folder: 'zappy/profiles' });
    profilePic = uploaded.secure_url;
  }

  const user = await User.create({
    fullName,
    email,
    username,
    password: hashed,
    profilePic,
    phone,
    gender
  });

  await OtpVerification.deleteOne({ email });

  const token = getToken({ id: user._id, username: user.username });
  return res.status(201).json({ token, user });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = getToken({ id: user._id, username: user.username });
  return res.json({ token, user });
};
