import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  getMessagesForChat
} from '../services/messageService.js';

export const getMessagesController = asyncHandler(async (req, res) => {
  const messages = await getMessagesForChat(req.params.chatId, req.auth.userId);
  res.json(messages);
});

export const sendMessageController = asyncHandler(async (req, res) => {
  const imageData = req.file
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    : req.body.imageData || '';

  const message = await createMessage({
    chatId: req.body.chatId,
    senderId: req.auth.userId,
    text: req.body.message || '',
    imageData,
    clientMessageId: req.body.clientMessageId || ''
  });

  res.status(201).json(message);
});

export const editMessageController = asyncHandler(async (req, res) => {
  const data = await editMessage({
    messageId: req.params.messageId,
    userId: req.auth.userId,
    text: req.body.message || ''
  });

  req.app.locals.io.to(`chat:${data.message.chatId}`).emit('message:update', data);
  res.json(data);
});

export const deleteMessageController = asyncHandler(async (req, res) => {
  const data = req.body.scope === 'everyone'
    ? await deleteMessageForEveryone({ messageId: req.params.messageId, userId: req.auth.userId })
    : await deleteMessageForMe({ messageId: req.params.messageId, userId: req.auth.userId });

  if (req.body.scope === 'everyone') {
    req.app.locals.io.to(`chat:${data.message.chatId}`).emit('message:update', data);
  }

  res.json(data);
});
