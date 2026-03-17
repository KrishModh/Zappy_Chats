import Chat from '../models/Chat.js';
import ChatRequest from '../models/ChatRequest.js';

export const sendRequest = async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId || receiverId === req.user.id) {
    return res.status(400).json({ message: 'Invalid receiver' });
  }

  const existing = await ChatRequest.findOne({ sender: req.user.id, receiver: receiverId });
  if (existing) return res.status(409).json({ message: 'Request already sent' });

  const request = await ChatRequest.create({ sender: req.user.id, receiver: receiverId });
  return res.status(201).json(request);
};

export const getReceivedRequests = async (req, res) => {
  const requests = await ChatRequest.find({ receiver: req.user.id, status: 'pending' }).populate(
    'sender',
    'username fullName profilePic'
  );
  return res.json(requests);
};

export const handleRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;

  const request = await ChatRequest.findOne({ _id: requestId, receiver: req.user.id });
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (!['accepted', 'rejected'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  request.status = action;
  await request.save();

  if (action === 'accepted') {
    const participants = [request.sender, request.receiver].sort();
    const existingChat = await Chat.findOne({ participants: { $all: participants, $size: 2 } });
    if (!existingChat) await Chat.create({ participants });
  }

  return res.json(request);
};

export const getChats = async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id }).populate('participants', 'username fullName profilePic');
  return res.json(chats);
};
