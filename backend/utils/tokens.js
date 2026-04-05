import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const accessAgeMs  = Number(process.env.ACCESS_TOKEN_MAX_AGE_MS  || 15 * 60 * 1000);
const refreshAgeMs = Number(process.env.REFRESH_TOKEN_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);

export const signAccessToken  = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: `${Math.floor(accessAgeMs  / 1000)}s` });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: `${Math.floor(refreshAgeMs / 1000)}s` });

export const signSocketToken  = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' });

export const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isProduction = process.env.NODE_ENV === 'production';

// cross-domain (Vercel → Render) ke liye sameSite: 'none' + secure: true zaroori hai
export const accessCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure:   isProduction,
  maxAge:   accessAgeMs
};

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure:   isProduction,
  maxAge:   refreshAgeMs
};