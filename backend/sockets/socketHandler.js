import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const onlineUsers = new Map();

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('send_message', async (payload) => {
      const { chatId, sender, receiver, message, image = '' } = payload;
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const saved = await Message.create({ chatId, sender, message, image });
      const receiverSocket = onlineUsers.get(receiver);

      if (receiverSocket) {
        io.to(receiverSocket).emit('receive_message', saved);
      }
      socket.emit('message_sent', saved);
    });

    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(socket.userId);
    });
  });
};
