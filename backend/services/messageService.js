import cloudinary from '../config/cloudinary.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/apiError.js';
import { serializeMessage } from '../utils/messageTransform.js';

export const getMessagesForChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.some((participant) => participant.toString() === userId.toString())) {
    throw new ApiError(403, 'Chat not accessible.');
  }

  const messages = await Message.find({ chatId }).sort({ timestamp: 1 }).lean();
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
  const chat = await Chat.findById(chatId);
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
