import cloudinary from '../config/cloudinary.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export const getMessages = async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.map((id) => id.toString()).includes(req.user.id)) {
    return res.status(403).json({ message: 'Chat not accessible' });
  }

  const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
  return res.json(messages);
};

export const sendMessage = async (req, res) => {
  const { chatId, message } = req.body;
  let image = '';

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.map((id) => id.toString()).includes(req.user.id)) {
    return res.status(400).json({ message: 'Chat does not exist or not allowed' });
  }

  if (req.file) {
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploaded = await cloudinary.uploader.upload(base64, { folder: 'zappy/messages' });
    image = uploaded.secure_url;
  }

  const saved = await Message.create({ chatId, sender: req.user.id, message, image });
  return res.status(201).json(saved);
};
