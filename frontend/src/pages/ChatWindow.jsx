import { useEffect, useMemo, useRef, useState } from 'react';
import MessageBubble from '../components/MessageBubble';
import { getSocket } from '../socket/socket';
import { formatDateSeparator, formatLastSeen } from '../utils/formatters';

const TYPING_STOP_DELAY = 1500;

const ChatWindow = ({ chat, currentUserId, onBack, messages, onSendMessage, typingState }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const socket = getSocket();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  const peer = chat?.peer;
  const isPeerTyping = typingState?.chatId === chat?._id && typingState?.isTyping && typingState?.senderId !== currentUserId;

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ''), [imageFile]);
  const groupedMessages = useMemo(
    () =>
      messages.reduce((items, message, index) => {
        const currentDate = new Date(message.timestamp).toDateString();
        const previousDate = index > 0 ? new Date(messages[index - 1].timestamp).toDateString() : null;
        if (currentDate !== previousDate) {
          items.push({ type: 'separator', value: formatDateSeparator(message.timestamp), key: `separator-${currentDate}` });
        }
        items.push({ type: 'message', value: message, key: message._id || message.clientMessageId || `${message.timestamp}-${index}` });
        return items;
      }, []),
    [messages]
  );

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const emitTyping = (isTyping) => {
    if (!socket || !chat?._id || !currentUserId) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId: chat._id,
      senderId: currentUserId
    });
    isTypingRef.current = isTyping;
  };

  const scheduleTypingStop = () => {
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTyping(false);
    }, TYPING_STOP_DELAY);
  };

  const stopTyping = () => {
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = null;
    if (isTypingRef.current) {
      emitTyping(false);
    }
  };

  useEffect(() => () => {
    stopTyping();
  }, []);

  useEffect(() => {
    stopTyping();
  }, [chat?._id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!chat || (!text.trim() && !imageFile)) return;

    stopTyping();
    setSending(true);
    await onSendMessage(chat, { text, imageFile });
    setText('');
    setImageFile(null);
    setSending(false);
  };

  if (!chat) {
    return (
      <section className="chat-panel placeholder-panel">
        <div>
          <h2>Zappy Web</h2>
          <p>Select a chat to start messaging securely.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <button type="button" className="mobile-back" onClick={onBack}>←</button>
        <img src={peer?.profilePic || 'https://placehold.co/48x48'} alt={peer?.username} />
        <div>
          <strong>{peer?.fullName || peer?.username}</strong>
          <p>{formatLastSeen(peer?.lastSeen, peer?.isOnline)}</p>
        </div>
      </header>

      <div className="messages-panel">
        {groupedMessages.map((item) =>
          item.type === 'separator' ? (
            <div key={item.key} className="date-separator">{item.value}</div>
          ) : (
            <MessageBubble
              key={item.key}
              message={item.value}
              isMine={item.value.sender?.toString?.() === currentUserId || item.value.sender === currentUserId}
            />
          )
        )}
        <div ref={messageEndRef} />
      </div>

      <div className={`typing-indicator ${isPeerTyping ? 'visible' : ''}`} aria-live="polite">
        {isPeerTyping ? (
          <>
            <span className="typing-indicator__label">{peer?.fullName || peer?.username || 'User'} is typing</span>
            <span className="typing-indicator__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </>
        ) : (
          <span className="typing-indicator__placeholder">&nbsp;</span>
        )}
      </div>

      <form className="message-composer" onSubmit={handleSubmit}>
        <label className="icon-button upload-button">
          📎
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
          />
        </label>
        <div className="composer-input-wrap">
          {previewUrl && (
            <div className="image-preview-pill">
              <img src={previewUrl} alt="preview" />
              <button type="button" className="ghost" onClick={() => setImageFile(null)}>×</button>
            </div>
          )}
          <input
            value={text}
            onChange={(event) => {
              const nextValue = event.target.value;
              setText(nextValue);

              if (!nextValue.trim()) {
                stopTyping();
                return;
              }

              if (!isTypingRef.current) {
                emitTyping(true);
              }
              scheduleTypingStop();
            }}
            onBlur={stopTyping}
            placeholder="Type a message"
          />
        </div>
        <button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
      </form>
    </section>
  );
};

export default ChatWindow;
