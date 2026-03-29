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

const sortChats = (items) =>
  [...items].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

const upsertMessage = (messages, message) => {
  const existingIndex = messages.findIndex(
    (item) =>
      item._id === message._id ||
      (item.clientMessageId && item.clientMessageId === message.clientMessageId)
  );

  if (existingIndex === -1) return [...messages, message];
  return messages.map((item, index) => (index === existingIndex ? { ...item, ...message } : item));
};

const updateExistingMessage = (messages, message) =>
  messages.some((item) => item._id === message._id)
    ? messages.map((item) => (item._id === message._id ? { ...item, ...message } : item))
    : messages;

const ChatDashboard = ({ refreshKey }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [activePanel, setActivePanel] = useState('chat');
  const [messagesByChat, setMessagesByChat] = useState({});
  const [typingState, setTypingState] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});

  const activeChat = useMemo(
    () => chats.find((chat) => chat._id === activeChatId) || null,
    [activeChatId, chats]
  );
  const activeMessages = messagesByChat[activeChatId] || [];
  const onlineCount = useMemo(() => chats.filter((chat) => chat.peer?.isOnline).length, [chats]);

  const loadChats = useCallback(async () => {
    const { data } = await api.get('/chats');
    setChats(data);
    setUnreadCounts((current) =>
      data.reduce((next, chat) => {
        next[chat._id] = current[chat._id] || 0;
        return next;
      }, {})
    );
    setActiveChatId((current) => {
      if (current && data.some((chat) => chat._id === current)) return current;
      return data[0]?._id || '';
    });
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    const { data } = await api.get(`/messages/${chatId}`);
    setMessagesByChat((current) => ({ ...current, [chatId]: data }));
    getSocket()?.emit('chat:join', chatId);
    getSocket()?.emit('chat:read', chatId);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats, refreshKey]);

  useEffect(() => {
    if (activeChatId && activePanel === 'chat') {
      loadMessages(activeChatId);
      setUnreadCounts((current) => ({ ...current, [activeChatId]: 0 }));
    }
  }, [activeChatId, activePanel, loadMessages]);

  useEffect(() => {
    if (activeChatId && chats.some((chat) => chat._id === activeChatId)) return;
    setActiveChatId(chats[0]?._id || '');
    setActivePanel('chat');
  }, [activeChatId, chats]);

  useEffect(() => {
    if (!feedbackMessage) return undefined;
    const timer = window.setTimeout(() => setFeedbackMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleMessage = (message) => {
      const messageSenderId = message.sender?.toString?.() || message.sender;

      setMessagesByChat((current) => ({
        ...current,
        [message.chatId]: upsertMessage(current[message.chatId] || [], message),
      }));

      // Increment unread count if message is from someone else and chat isn't currently open
      if (
        messageSenderId !== user?._id &&
        !(activeChatId === message.chatId && activePanel === 'chat')
      ) {
        setUnreadCounts((current) => ({
          ...current,
          [message.chatId]: (current[message.chatId] || 0) + 1,
        }));
      }

      // Clear typing indicator for the sender
      setTypingState((current) =>
        current?.chatId === message.chatId &&
        current?.senderId === (message.sender?.toString?.() || message.sender)
          ? null
          : current
      );

      // Update chat list preview + sort
      setChats((current) =>
        sortChats(
          current.map((chat) =>
            chat._id === message.chatId
              ? { ...chat, lastMessage: message.message || 'Image', lastMessageAt: message.timestamp }
              : chat
          )
        )
      );

      // Mark as read if this chat is currently active
      setActiveChatId((currentActiveChatId) => {
        if (currentActiveChatId === message.chatId) {
          getSocket()?.emit('chat:read', message.chatId);
        }
        return currentActiveChatId;
      });
    };

    // Blue tick / read-receipt status updates
    const handleMessageStatus = ({ updates }) => {
      if (!updates?.length) return;
      setMessagesByChat((current) => {
        const next = { ...current };
        updates.forEach((update) => {
          const chatMessages = next[update.chatId] || [];
          next[update.chatId] = chatMessages.map((message) =>
            message._id?.toString() === update._id?.toString()
              ? { ...message, status: update.status }
              : message
          );
        });
        return next;
      });
    };

    const handleMessageUpdate = ({ message, lastMessagePreview }) => {
      setMessagesByChat((current) => ({
        ...current,
        [message.chatId]: updateExistingMessage(current[message.chatId] || [], message),
      }));
      setChats((current) =>
        current.map((chat) =>
          chat._id === message.chatId
            ? { ...chat, lastMessage: lastMessagePreview || 'Start chatting' }
            : chat
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
      setUnreadCounts((current) => {
        const next = { ...current };
        delete next[chatId];
        return next;
      });
      setMessagesByChat((current) => {
        const next = { ...current };
        delete next[chatId];
        return next;
      });
      setTypingState((current) => (current?.chatId === chatId ? null : current));
      if (activeChatId === chatId) setActivePanel('chat');
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
      setUnreadCounts((current) => ({ ...current, [chat._id]: current[chat._id] || 0 }));
      setFeedbackMessage(`${chat.peer?.fullName || chat.peer?.username} is available again.`);
    };

    socket.on('message:receive', handleMessage);
    socket.on('message:status', handleMessageStatus);
    socket.on('message:update', handleMessageUpdate);
    socket.on('presence:update', handlePresence);
    socket.on('typing:update', handleTyping);
    socket.on('profile:update', handleProfileUpdate);
    socket.on('chat:removed', handleChatRemoved);
    socket.on('chat:restored', handleChatRestored);

    return () => {
      socket.off('message:receive', handleMessage);
      socket.off('message:status', handleMessageStatus);
      socket.off('message:update', handleMessageUpdate);
      socket.off('presence:update', handlePresence);
      socket.off('typing:update', handleTyping);
      socket.off('profile:update', handleProfileUpdate);
      socket.off('chat:removed', handleChatRemoved);
      socket.off('chat:restored', handleChatRestored);
    };
  }, [activeChatId, activePanel, user?._id]);

  const handleSendMessage = useCallback(async (chat, { text, imageFile }) => {
    const socket = getSocket();
    if (!socket) return;

    const clientMessageId = `${chat._id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const imageData = imageFile ? await fileToBase64(imageFile) : '';

    await new Promise((resolve) => {
      // 30-second timeout fallback in case the server never acks
      const timeout = window.setTimeout(() => resolve({ ok: false, timeout: true }), 30000);

      socket.emit(
        'message:send',
        { chatId: chat._id, message: text, imageData, clientMessageId },
        (response) => {
          window.clearTimeout(timeout);
          resolve(response);
        }
      );
    });
  }, []);

  const handleEditMessage = useCallback(async (messageId, text) => {
    const { data } = await api.patch(`/messages/${messageId}`, { message: text });
    setMessagesByChat((current) => ({
      ...current,
      [data.message.chatId]: upsertMessage(current[data.message.chatId] || [], data.message),
    }));
    setChats((current) =>
      current.map((chat) =>
        chat._id === data.message.chatId
          ? { ...chat, lastMessage: data.lastMessagePreview || 'Start chatting' }
          : chat
      )
    );
    return data;
  }, []);

  const handleDeleteMessage = useCallback(async ({ messageId, scope, chatId }) => {
    const { data } = await api.delete(`/messages/${messageId}`, { data: { scope } });

    if (scope === 'me') {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] || []).filter((message) => message._id !== messageId),
      }));
      setChats((current) =>
        current.map((chat) =>
          chat._id === chatId
            ? { ...chat, lastMessage: data.lastMessagePreview || 'Start chatting' }
            : chat
        )
      );
      return data;
    }

    setMessagesByChat((current) => ({
      ...current,
      [data.message.chatId]: upsertMessage(current[data.message.chatId] || [], data.message),
    }));
    setChats((current) =>
      current.map((chat) =>
        chat._id === data.message.chatId
          ? { ...chat, lastMessage: data.lastMessagePreview || 'Start chatting' }
          : chat
      )
    );
    return data;
  }, []);

  const handleRemoveFriend = useCallback(async (chat) => {
    if (!window.confirm(`Remove ${chat.peer?.fullName || chat.peer?.username} from your chats?`)) return;
    await api.delete(`/chats/${chat._id}`);
  }, []);

  return (
    <section className="dashboard-shell">
      <div className="whatsapp-layout">
        <aside className={`sidebar-panel ${mobileChatOpen ? 'mobile-hidden' : ''}`}>
          <div className="sidebar-header sidebar-header-stack">
            <div>
              <h2>Chats</h2>
              <p>
                {user?.fullName
                  ? `Welcome back, ${user.fullName.split(' ')[0]}.`
                  : 'Your conversations and live presence.'}
              </p>
            </div>
            <div className="sidebar-insights" aria-label="Chat summary">
              <span>{chats.length} chats</span>
              <span>{onlineCount} online</span>
            </div>
            {feedbackMessage && <span className="status-toast">{feedbackMessage}</span>}
          </div>
          <div className="chat-list-scroll">
            {chats.length === 0 ? (
              <div className="empty-state">
                No chats yet. Search for users and send a request to begin.
              </div>
            ) : (
              chats.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  active={chat._id === activeChatId}
                  unreadCount={unreadCounts[chat._id] || 0}
                  onSelect={(selectedChat) => {
                    setActiveChatId(selectedChat._id);
                    setActivePanel('chat');
                    setUnreadCounts((current) => ({ ...current, [selectedChat._id]: 0 }));
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
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
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