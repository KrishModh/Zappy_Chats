import Chat from '../models/Chat.js';
import ChatRequest from '../models/ChatRequest.js';
import Message from '../models/Message.js';
import { ApiError } from '../utils/apiError.js';

export const serializeChatForUser = (chat, currentUserId, onlineUserIds = new Set()) => {
  const normalizedChat = chat.toObject ? chat.toObject() : chat;
  const peer = normalizedChat.participants.find((participant) => participant._id.toString() !== currentUserId.toString());

  return {
    ...normalizedChat,
    peer: peer
      ? {
          _id: peer._id,
          username: peer.username,
          fullName: peer.fullName,
          profilePic: peer.profilePic,
          lastSeen: peer.lastSeen,
          isOnline: onlineUserIds.has(peer._id.toString())
        }
      : null
  };
};

export const createChatRequest = async (senderId, receiverId) => {
  if (senderId.toString() === receiverId.toString()) {
    throw new ApiError(400, 'You cannot send a chat request to yourself.');
  }

  const [existingRequest, existingChat] = await Promise.all([
    ChatRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    }),
    Chat.findOne({ participants: { $all: [senderId, receiverId], $size: 2 }, isActive: true })
  ]);

  if (existingRequest) {
    throw new ApiError(409, 'A chat request already exists for this user.');
  }

  if (existingChat) {
    throw new ApiError(409, 'Chat already exists with this user.');
  }

  return ChatRequest.create({ sender: senderId, receiver: receiverId });
};

export const getPendingRequests = async (userId) =>
  ChatRequest.find({ receiver: userId, status: 'pending' })
    .populate('sender', 'username fullName profilePic lastSeen')
    .sort({ createdAt: -1 });

export const respondToRequest = async (requestId, currentUserId, action) => {
  const request = await ChatRequest.findOne({ _id: requestId, receiver: currentUserId }).populate(
    'sender receiver',
    'username fullName profilePic lastSeen'
  );

  if (!request) {
    throw new ApiError(404, 'Chat request not found.');
  }

  request.status = action;
  await request.save();

  let chat = null;
  if (action === 'accepted') {
    chat = await Chat.findOneAndUpdate(
      { participants: { $all: [request.sender._id, request.receiver._id], $size: 2 } },
      {
        $set: { isActive: true },
        $setOnInsert: { participants: [request.sender._id, request.receiver._id] }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('participants', 'username fullName profilePic lastSeen');
  }

  return { request, chat };
};

export const getUserChats = async (userId, onlineUserIds = new Set()) => {
  const chats = await Chat.find({ participants: userId, isActive: true })
    .populate('participants', 'username fullName profilePic lastSeen')
    .sort({ lastMessageAt: -1 })
    .lean();

  const previews = await Promise.all(chats.map((chat) => getLastMessagePreview(chat._id, userId)));
  return chats.map((chat, index) => serializeChatForUser({ ...chat, lastMessage: previews[index] }, userId, onlineUserIds));
};

export const ensureChatParticipant = async (chatId, userId) => {
  const chat = await Chat.findOne({ _id: chatId, isActive: true });

  if (!chat || !chat.participants.some((participant) => participant.toString() === userId.toString())) {
    throw new ApiError(403, 'You do not have access to this chat.');
  }

  return chat;
};

export const removeFriend = async (chatId, currentUserId) => {
  const chat = await Chat.findById(chatId).populate('participants', 'username fullName profilePic lastSeen');

  if (!chat || !chat.isActive) {
    throw new ApiError(404, 'Chat not found.');
  }

  if (!chat.participants.some((participant) => participant._id.toString() === currentUserId.toString())) {
    throw new ApiError(403, 'You do not have access to this chat.');
  }

  chat.isActive = false;
  await chat.save();

  const participantIds = chat.participants.map((participant) => participant._id.toString());
  await ChatRequest.deleteMany({
    $or: [
      { sender: participantIds[0], receiver: participantIds[1] },
      { sender: participantIds[1], receiver: participantIds[0] }
    ]
  });

  return {
    chat,
    chatId: chat._id.toString(),
    participantIds
  };
};

export const getLastMessagePreview = async (chatId, userId = null) => {
  const query = { chatId };
  if (userId) {
    query.deletedFor = { $ne: userId };
  }

  const latest = await Message.findOne(query).sort({ timestamp: -1 }).lean();
  return latest ? latest.message || 'Image' : '';
};
