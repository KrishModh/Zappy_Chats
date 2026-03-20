import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getUserChats } from '../services/chatService.js';
import { createMessage, updateChatMessageStatuses, updateMessageStatus } from '../services/messageService.js';
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

const emitStatusUpdates = (io, updates) => {
  if (updates.length === 0) {
    return;
  }

  io.to(`chat:${updates[0].chatId}`).emit('message:status', { updates });
};

const isChatOpenForRecipient = (io, chatId, senderId, participants = []) =>
  participants.some((participant) => {
    const participantId = participant.toString();
    if (participantId === senderId.toString()) {
      return false;
    }

    const participantSocketIds = socketRooms.get(participantId);
    if (!participantSocketIds) {
      return false;
    }

    return [...participantSocketIds].some((socketId) => io.sockets.sockets.get(socketId)?.activeChatId === chatId.toString());
  });

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
      for (const chat of chats) {
        socket.join(`chat:${chat._id}`);
        const deliveredUpdates = await updateChatMessageStatuses({
          chatId: chat._id,
          viewerId: userId,
          status: 'delivered',
          currentStatuses: ['sent']
        });
        emitStatusUpdates(io, deliveredUpdates);
      }
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

        const chat = await Chat.findById(payload.chatId).select('participants').lean();
        const recipientIsOnline = chat?.participants?.some(
          (participant) => participant.toString() !== userId.toString() && socketRooms.has(participant.toString())
        );
        const recipientHasChatOpen = isChatOpenForRecipient(io, payload.chatId, userId, chat?.participants || []);
        const nextStatus = recipientHasChatOpen ? 'seen' : 'delivered';

        if (recipientIsOnline) {
          const deliveredMessage = await updateMessageStatus({ messageId: message._id, status: nextStatus });
          if (deliveredMessage) {
            emitStatusUpdates(io, [
              {
                _id: deliveredMessage._id.toString(),
                chatId: deliveredMessage.chatId.toString(),
                status: deliveredMessage.status
              }
            ]);
          }
        }
      } catch (error) {
        callback({ ok: false, message: error.message });
      }
    });

    socket.on('chat:join', async (chatId) => {
      socket.activeChatId = chatId;
      socket.join(`chat:${chatId}`);

      try {
        const seenUpdates = await updateChatMessageStatuses({
          chatId,
          viewerId: userId,
          status: 'seen',
          currentStatuses: ['sent', 'delivered']
        });
        emitStatusUpdates(io, seenUpdates);
      } catch (error) {
        logger.warn({ message: 'Unable to mark chat messages as seen.', chatId, error: error.message });
      }
    });

    socket.on('typing:start', ({ chatId, receiverId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', { chatId, userId, receiverId, isTyping: true });
    });

    socket.on('typing:stop', ({ chatId, receiverId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', { chatId, userId, receiverId, isTyping: false });
    });

    socket.on('disconnect', async () => {
      socket.activeChatId = null;
      const becameOffline = await setUserOffline(userId, socket.id);
      app.locals.onlineUserIds = getOnlineUserIds();
      if (becameOffline) {
        socket.broadcast.emit('presence:update', { userId, isOnline: false, lastSeen: new Date().toISOString() });
      }
    });
  });
};
