import { useCallback, useEffect, useMemo, useState } from 'react';
import ChatListItem from '../components/ChatListItem';
import UserProfilePanel from '../components/UserProfilePanel';
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

const sortChats = (items) => [...items].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

const ChatDashboard = ({ refreshKey }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [activePanel, setActivePanel] = useState('chat');
  const [messagesByChat, setMessagesByChat] = useState({});
  const [typingState, setTypingState] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const activeChat = useMemo(() => chats.find((chat) => chat._id === activeChatId) || null, [activeChatId, chats]);
  const activeMessages = messagesByChat[activeChatId] || [];

  const loadChats = useCallback(async () => {
    const { data } = await api.get('/chats');
    setChats(data);
    setActiveChatId((current) => {
      if (current && data.some((chat) => chat._id === current)) {
        return current;
      }
      return data[0]?._id || '';
    });
  }, []);

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
    if (activeChatId && activePanel === 'chat') {
      loadMessages(activeChatId);
    }
  }, [activeChatId, activePanel, loadMessages]);

  useEffect(() => {
    if (activeChatId && chats.some((chat) => chat._id === activeChatId)) {
      return;
    }

    setActiveChatId(chats[0]?._id || '');
    setActivePanel('chat');
  }, [activeChatId, chats]);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFeedbackMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

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
        sortChats(
          current.map((chat) =>
            chat._id === message.chatId
              ? { ...chat, lastMessage: message.message || 'Image', lastMessageAt: message.timestamp }
              : chat
          )
        )
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

    const handleChatRemoved = ({ chatId, removedBy }) => {
      setChats((current) => current.filter((chat) => chat._id !== chatId));
      setMessagesByChat((current) => {
        const next = { ...current };
        delete next[chatId];
        return next;
      });
      setTypingState((current) => (current?.chatId === chatId ? null : current));
      if (activeChatId === chatId) {
        setActivePanel('chat');
      }
      setFeedbackMessage(removedBy === user?._id ? 'Friend removed.' : 'A chat was removed.');
    };

    const handleChatRestored = ({ chat }) => {
      setChats((current) => {
        const nextChats = current.some((item) => item._id === chat._id)
          ? current.map((item) => (item._id === chat._id ? { ...item, ...chat } : item))
          : [...current, chat];
        return sortChats(nextChats);
      });
      setActiveChatId((current) => current || chat._id);
      setFeedbackMessage(`${chat.peer?.fullName || chat.peer?.username} is available again.`);
    };

    socket.on('message:receive', handleMessage);
    socket.on('presence:update', handlePresence);
    socket.on('typing:update', handleTyping);
    socket.on('profile:update', handleProfileUpdate);
    socket.on('chat:removed', handleChatRemoved);
    socket.on('chat:restored', handleChatRestored);

    return () => {
      socket.off('message:receive', handleMessage);
      socket.off('presence:update', handlePresence);
      socket.off('typing:update', handleTyping);
      socket.off('profile:update', handleProfileUpdate);
      socket.off('chat:removed', handleChatRemoved);
      socket.off('chat:restored', handleChatRestored);
    };
  }, [activeChatId, user?._id]);

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

  const handleRemoveFriend = useCallback(async (chat) => {
    if (!window.confirm(`Remove ${chat.peer?.fullName || chat.peer?.username} from your chats?`)) {
      return;
    }

    await api.delete(`/chats/${chat._id}`);
  }, []);

  return (
    <section className="dashboard-shell">
      <div className="whatsapp-layout">
        <aside className={`sidebar-panel ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header sidebar-header-stack">
            <div>
              <h2>Chats</h2>
              <p>Your conversations and live presence.</p>
            </div>
            {feedbackMessage && <span className="status-toast">{feedbackMessage}</span>}
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
                    setActivePanel('chat');
                    setMobileChatOpen(true);
                  }}
                  onViewProfile={(selectedChat) => {
                    setActiveChatId(selectedChat._id);
                    setActivePanel('profile');
                    setMobileChatOpen(true);
                  }}
                  onRemoveFriend={handleRemoveFriend}
                />
              ))
            )}
          </div>
        </aside>
        <div className={`chat-stage ${mobileChatOpen ? 'mobile-open' : ''}`}>
          {activePanel === 'profile' ? (
            <UserProfilePanel chat={activeChat} onBack={() => setActivePanel('chat')} />
          ) : (
            <ChatWindow
              chat={activeChat}
              currentUserId={user?._id || ''}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              typingState={typingState}
              onBack={() => setMobileChatOpen(false)}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ChatDashboard;
