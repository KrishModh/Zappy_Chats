import getCloudinary from '../config/cloudinary.js';
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
  if (!imageData) return '';

  const cloudinary = getCloudinary();
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
    status: 'sent'
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: savedMessage.message || 'Image',
    lastMessageAt: savedMessage.timestamp
  });

  return serializeMessage(savedMessage);
};

export const updateDeliveryStatus = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) return [];

  // 👇 Pehle find karo jo update honge
  const toUpdate = await Message.find({
    chatId,
    sender: { $ne: userId },
    status: 'sent'
  }).lean();

  if (toUpdate.length === 0) return [];

  const ids = toUpdate.map((m) => m._id);
  await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'delivered' } });

  return toUpdate.map((message) => ({
    _id: message._id.toString(),
    chatId: message.chatId.toString(),
    status: 'delivered'
  }));
};

export const markMessagesAsRead = async (chatId, userId) => {
  // 👇 Sirf wahi messages jo ABHI update honge
  const toUpdate = await Message.find({
    chatId,
    sender: { $ne: userId },
    status: { $in: ['sent', 'delivered'] }
  }).lean();

  if (toUpdate.length === 0) return [];

  const ids = toUpdate.map((m) => m._id);
  await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'read' } });

  return toUpdate.map((message) => ({
    _id: message._id.toString(),
    chatId: message.chatId.toString(),
    status: 'read'
  }));
};

// 👇 Single message status update
export const updateMessageStatus = async (messageId, status) => {
  await Message.findByIdAndUpdate(messageId, { $set: { status } });
};