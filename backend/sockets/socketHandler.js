import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getUserChats } from '../services/chatService.js';
import { createMessage } from '../services/messageService.js';
import { logger } from '../config/logger.js';

const socketRooms = new Map();
const deliveredMessageIds = new Set();

const getOnlineUserIds = () => new Set([...socketRooms.keys()]);

const setUserOnline = (userId, socketId) => {
  const existing = socketRooms.get(userId) || new Set();
  existing.add(socketId);
  socketRooms.set(userId, existing);
};

const setUserOffline = async (userId, socketId) => {
  const sockets = socketRooms.get(userId);
  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);
  if (sockets.size === 0) {
    socketRooms.delete(userId);
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    return true;
  }

  socketRooms.set(userId, sockets);
  return false;
};

export const setupSocket = (io, app) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      return next();
    } catch {
      return next(new Error('Invalid socket token.'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    setUserOnline(userId, socket.id);
    app.locals.onlineUserIds = getOnlineUserIds();
    socket.emit('presence:bootstrap', { onlineUserIds: [...app.locals.onlineUserIds] });
    socket.broadcast.emit('presence:update', { userId, isOnline: true, lastSeen: null });

    try {
      const chats = await getUserChats(userId, app.locals.onlineUserIds);
      chats.forEach((chat) => socket.join(`chat:${chat._id}`));
    } catch (error) {
      logger.warn({ message: 'Unable to join chat rooms on connect.', error: error.message });
    }

    socket.on('message:send', async (payload, callback = () => {}) => {
      try {
        const clientMessageId = payload.clientMessageId || `${socket.id}-${Date.now()}`;
        if (deliveredMessageIds.has(clientMessageId)) {
          return callback({ ok: true, duplicate: true });
        }

        const message = await createMessage({
          chatId: payload.chatId,
          senderId: userId,
          text: payload.message || '',
          imageData: payload.imageData || '',
          clientMessageId
        });

        deliveredMessageIds.add(clientMessageId);
        if (deliveredMessageIds.size > 5000) {
          const [first] = deliveredMessageIds;
          deliveredMessageIds.delete(first);
        }

        io.to(`chat:${payload.chatId}`).emit('message:receive', message);
        callback({ ok: true, message });
      } catch (error) {
        callback({ ok: false, message: error.message });
      }
    });

    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('typing:start', ({ chatId, senderId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        chatId,
        senderId: senderId || userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ chatId, senderId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        chatId,
        senderId: senderId || userId,
        isTyping: false
      });
    });

    socket.on('disconnect', async () => {
      const becameOffline = await setUserOffline(userId, socket.id);
      app.locals.onlineUserIds = getOnlineUserIds();
      if (becameOffline) {
        socket.broadcast.emit('presence:update', { userId, isOnline: false, lastSeen: new Date().toISOString() });
      }
    });
  });
};
