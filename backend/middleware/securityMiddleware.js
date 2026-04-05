import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';

const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map((item) => item.trim());

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 250),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
});

export const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true  // cookies cross-domain bhejne ke liye zaroori
};

export const corsMiddleware = cors(corsOptions);

export const applySecurityMiddleware = (app) => {
  app.set('trust proxy', 1); // 👈 Render ke reverse proxy ke liye zaroori
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use((req, _res, next) => {
    if (typeof req.body === 'object' && req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].replace(/[<>]/g, '').trim();
        }
      });
    }
    next();
  });
  app.use(process.env.NODE_ENV === 'production' ? (_req, _res, next) => next() : morgan('dev'));
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.originalUrl });
    next();
  });
};