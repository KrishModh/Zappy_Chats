import { useCallback, useEffect, useMemo, useState } from 'react';
import ChatListItem from '../components/ChatListItem';
import api from '../api/client';
import ChatWindow from './ChatWindow';
import { getSocket } from '../socket/socket';
import { useAuth } from '../context/AuthContext';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ChatDashboard = ({ refreshKey }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [messagesByChat, setMessagesByChat] = useState({});
  const [typingState, setTypingState] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const activeChat = useMemo(() => chats.find((chat) => chat._id === activeChatId) || null, [activeChatId, chats]);
  const activeMessages = messagesByChat[activeChatId] || [];

  const loadChats = useCallback(async () => {
    const { data } = await api.get('/chats');
    setChats(data);
    if (!activeChatId && data[0]) {
      setActiveChatId(data[0]._id);
    }
  }, [activeChatId]);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    const { data } = await api.get(`/messages/${chatId}`);
    setMessagesByChat((current) => ({ ...current, [chatId]: data }));
    getSocket()?.emit('chat:join', chatId);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats, refreshKey]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId, loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleMessage = (message) => {
      setMessagesByChat((current) => {
        const existing = current[message.chatId] || [];
        if (existing.some((item) => item.clientMessageId && item.clientMessageId === message.clientMessageId)) {
          return current;
        }
        return { ...current, [message.chatId]: [...existing, message] };
      });
      setTypingState((current) =>
        current?.chatId === message.chatId && current?.senderId === (message.sender?.toString?.() || message.sender)
          ? null
          : current
      );
      setChats((current) =>
        current
          .map((chat) =>
            chat._id === message.chatId
              ? { ...chat, lastMessage: message.message || 'Image', lastMessageAt: message.timestamp }
              : chat
          )
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    };

    const handlePresence = ({ userId, isOnline, lastSeen }) => {
      setChats((current) =>
        current.map((chat) =>
          chat.peer?._id === userId
            ? { ...chat, peer: { ...chat.peer, isOnline, lastSeen: lastSeen || chat.peer.lastSeen } }
            : chat
        )
      );
    };

    const handleTyping = (payload) => {
      setTypingState(payload.isTyping ? payload : null);
    };

    const handleProfileUpdate = (payload) => {
      setChats((current) =>
        current.map((chat) =>
          chat.peer?._id === payload._id ? { ...chat, peer: { ...chat.peer, ...payload } } : chat
        )
      );
    };

    socket.on('message:receive', handleMessage);
    socket.on('presence:update', handlePresence);
    socket.on('typing:update', handleTyping);
    socket.on('profile:update', handleProfileUpdate);

    return () => {
      socket.off('message:receive', handleMessage);
      socket.off('presence:update', handlePresence);
      socket.off('typing:update', handleTyping);
      socket.off('profile:update', handleProfileUpdate);
    };
  }, []);

  const handleSendMessage = useCallback(async (chat, { text, imageFile }) => {
    const socket = getSocket();
    if (!socket) return;

    const clientMessageId = `${chat._id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const imageData = imageFile ? await fileToBase64(imageFile) : '';

    await new Promise((resolve) => {
      socket.emit(
        'message:send',
        {
          chatId: chat._id,
          message: text,
          imageData,
          clientMessageId
        },
        (response) => {
          if (response?.ok && response.message) {
            setMessagesByChat((current) => ({
              ...current,
              [chat._id]: [...(current[chat._id] || []), response.message]
            }));
          }
          resolve(response);
        }
      );
    });
  }, []);

  return (
    <section className="dashboard-shell">
      <div className="whatsapp-layout">
        <aside className={`sidebar-panel ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header">
            <div>
              <h2>Chats</h2>
              <p>Your conversations and live presence.</p>
            </div>
          </div>
          <div className="chat-list-scroll">
            {chats.length === 0 ? (
              <div className="empty-state">No chats yet. Search for users and send a request to begin.</div>
            ) : (
              chats.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  active={chat._id === activeChatId}
                  onSelect={(selectedChat) => {
                    setActiveChatId(selectedChat._id);
                    setMobileChatOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </aside>
        <div className={`chat-stage ${mobileChatOpen ? 'mobile-open' : ''}`}>
          <ChatWindow
            chat={activeChat}
            currentUserId={user?._id || ''}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            typingState={typingState}
            onBack={() => setMobileChatOpen(false)}
          />
        </div>
      </div>
    </section>
  );
};

export default ChatDashboard;
