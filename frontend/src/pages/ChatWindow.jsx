import { useEffect, useState } from 'react';
import api from '../api/client';
import { getSocket } from '../socket/socket';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!chat) return;
    api.get(`/messages/${chat._id}`).then(({ data }) => setMessages(data));
  }, [chat]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (incoming) => {
      if (incoming.chatId === chat?._id) setMessages((prev) => [...prev, incoming]);
    };

    socket.on('receive_message', handler);
    socket.on('message_sent', handler);
    return () => {
      socket.off('receive_message', handler);
      socket.off('message_sent', handler);
    };
  }, [chat]);

  const send = async (e) => {
    e.preventDefault();
    if (!chat || !text.trim()) return;

    const otherUser = chat.participants.find((p) => p._id !== user._id);
    getSocket().emit('send_message', {
      chatId: chat._id,
      sender: user._id,
      receiver: otherUser?._id,
      message: text
    });

    setText('');
  };

  if (!chat) return <section className="card">Select a chat to start messaging.</section>;

  return (
    <section className="card chat-window">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg._id || msg.timestamp} className={`bubble ${msg.sender === user._id ? 'me' : ''}`}>
            {msg.message}
            {msg.image && <img src={msg.image} alt="attachment" />}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="message-form">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message" />
        <button type="submit">Send</button>
      </form>
    </section>
  );
};

export default ChatWindow;
