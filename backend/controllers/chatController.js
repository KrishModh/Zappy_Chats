import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createChatRequest,
  getPendingRequests,
  getUserChats,
  removeFriend,
  respondToRequest,
  serializeChatForUser
} from '../services/chatService.js';

export const sendRequestController = asyncHandler(async (req, res) => {
  const request = await createChatRequest(req.auth.userId, req.body.receiverId);
  res.status(201).json(request);
});

export const getReceivedRequestsController = asyncHandler(async (req, res) => {
  const requests = await getPendingRequests(req.auth.userId);
  res.json(requests);
});

export const handleRequestController = asyncHandler(async (req, res) => {
  const data = await respondToRequest(req.params.requestId, req.auth.userId, req.body.action);

  if (data.chat) {
    const io = req.app.locals.io;
    const onlineUserIds = req.app.locals.onlineUserIds || new Set();

    data.chat.participants.forEach((participant) => {
      io.to(`user:${participant._id}`).emit('chat:restored', {
        chat: serializeChatForUser(data.chat, participant._id, onlineUserIds)
      });
    });
  }

  res.json(data);
});

export const getChatsController = asyncHandler(async (req, res) => {
  const chats = await getUserChats(req.auth.userId, req.app.locals.onlineUserIds);
  res.json(chats);
});

export const removeFriendController = asyncHandler(async (req, res) => {
  const data = await removeFriend(req.params.chatId, req.auth.userId);
  const io = req.app.locals.io;

  data.participantIds.forEach((participantId) => {
    io.to(`user:${participantId}`).emit('chat:removed', {
      chatId: data.chatId,
      removedBy: req.auth.userId
    });
  });

  res.json({ message: 'Friend removed.', chatId: data.chatId });
});
