import cloudinary from '../config/cloudinary.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/apiError.js';
import { serializeMessage } from '../utils/messageTransform.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TIME_LIMIT_MESSAGE = 'You can only edit or delete messages within 5 minutes of sending.';
const DELETED_MESSAGE_TEXT = 'This message is deleted';

const getChatPreviewForUser = async (chatId, userId) => {
  const latest = await Message.findOne({
    chatId,
    deletedFor: { $ne: userId }
  })
    .sort({ timestamp: -1 })
    .lean();

  return latest ? latest.message || 'Image' : '';
};

const getChatPreview = async (chatId) => {
  const latest = await Message.findOne({ chatId }).sort({ timestamp: -1 }).lean();
  return latest ? latest.message || 'Image' : '';
};

const getAccessibleMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, 'Message not found.');
  }

  const chat = await Chat.findOne({ _id: message.chatId, isActive: true });
  if (!chat || !chat.participants.some((participant) => participant.toString() === userId.toString())) {
    throw new ApiError(403, 'Chat not accessible.');
  }

  return { message, chat };
};

const ensureSenderWithinTimeLimit = (message, userId) => {
  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only manage your own messages.');
  }

  if (Date.now() - new Date(message.timestamp).getTime() > FIVE_MINUTES_MS) {
    throw new ApiError(400, TIME_LIMIT_MESSAGE);
  }
};

export const getMessagesForChat = async (chatId, userId) => {
  const chat = await Chat.findOne({ _id: chatId, isActive: true });
  if (!chat || !chat.participants.some((participant) => participant.toString() === userId.toString())) {
    throw new ApiError(403, 'Chat not accessible.');
  }

  const messages = await Message.find({
    chatId,
    deletedFor: { $ne: userId }
  })
    .sort({ timestamp: 1 })
    .lean();

  return messages;
};

const uploadInlineImage = async (imageData) => {
  if (!imageData) {
    return '';
  }

  const result = await cloudinary.uploader.upload(imageData, {
    folder: 'zappy/messages',
    resource_type: 'image'
  });

  return result.secure_url;
};

export const createMessage = async ({ chatId, senderId, text = '', imageData = '', clientMessageId = '' }) => {
  const chat = await Chat.findOne({ _id: chatId, isActive: true });
  if (!chat || !chat.participants.some((participant) => participant.toString() === senderId.toString())) {
    throw new ApiError(400, 'Chat does not exist or you do not have access.');
  }

  if (!text.trim() && !imageData) {
    throw new ApiError(400, 'Message content is required.');
  }

  if (clientMessageId) {
    const duplicate = await Message.findOne({ clientMessageId });
    if (duplicate) {
      return serializeMessage(duplicate);
    }
  }

  const image = await uploadInlineImage(imageData);
  const savedMessage = await Message.create({
    chatId,
    sender: senderId,
    message: text.trim(),
    image,
    clientMessageId,
    status: 'delivered'
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: savedMessage.message || 'Image',
    lastMessageAt: savedMessage.timestamp
  });

  return serializeMessage(savedMessage);
};

export const editMessage = async ({ messageId, userId, text }) => {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new ApiError(400, 'Message content is required.');
  }

  const { message } = await getAccessibleMessage(messageId, userId);
  ensureSenderWithinTimeLimit(message, userId);

  if (message.isDeleted) {
    throw new ApiError(400, 'Deleted messages cannot be edited.');
  }

  if (!message.message) {
    throw new ApiError(400, 'Only text messages can be edited.');
  }

  message.message = trimmedText;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  const lastMessagePreview = await getChatPreview(message.chatId);
  await Chat.findByIdAndUpdate(message.chatId, { lastMessage: lastMessagePreview });

  return {
    message: serializeMessage(message),
    lastMessagePreview
  };
};

export const deleteMessageForEveryone = async ({ messageId, userId }) => {
  const { message } = await getAccessibleMessage(messageId, userId);
  ensureSenderWithinTimeLimit(message, userId);

  message.isDeleted = true;
  message.message = DELETED_MESSAGE_TEXT;
  message.image = '';
  message.isEdited = false;
  message.editedAt = null;
  await message.save();

  const lastMessagePreview = await getChatPreview(message.chatId);
  await Chat.findByIdAndUpdate(message.chatId, { lastMessage: lastMessagePreview });

  return {
    message: serializeMessage(message),
    lastMessagePreview
  };
};

export const deleteMessageForMe = async ({ messageId, userId }) => {
  const { message } = await getAccessibleMessage(messageId, userId);

  if (!message.deletedFor.some((entry) => entry.toString() === userId.toString())) {
    message.deletedFor.push(userId);
    await message.save();
  }

  const lastMessagePreview = await getChatPreviewForUser(message.chatId, userId);

  return {
    messageId: message._id.toString(),
    chatId: message.chatId.toString(),
    lastMessagePreview
  };
};

export { FIVE_MINUTES_MS, TIME_LIMIT_MESSAGE };
