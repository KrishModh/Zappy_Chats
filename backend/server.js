import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { apiLimiter, applySecurityMiddleware, corsOptions } from './middleware/securityMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { setupSocket } from './sockets/socketHandler.js';

dotenv.config();

const app = express();
app.locals.onlineUserIds = new Set();

applySecurityMiddleware(app);
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zappy-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 20000,
  pingInterval: 10000,
  maxHttpBufferSize: 10 * 1024 * 1024,
});

app.locals.io = io;
setupSocket(io, app);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}.`);
    });
  })
  .catch((error) => {
    logger.error({ message: 'Failed to start server.', error: error.message });
    process.exit(1);
  });