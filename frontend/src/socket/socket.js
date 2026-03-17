import { io } from 'socket.io-client';

let socket;

export const connectSocket = (userId) => {
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  socket = io(url);
  socket.emit('join', userId);
  return socket;
};

export const getSocket = () => socket;
