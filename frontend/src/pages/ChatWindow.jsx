import { useEffect, useMemo, useRef, useState } from 'react';
import MessageBubble from '../components/MessageBubble';
import { getSocket } from '../socket/socket';
import { formatDateSeparator, formatLastSeen } from '../utils/formatters';

const ChatWindow = ({ chat, currentUserId, onBack, messages, onSendMessage, typingState }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingState]);

  const peer = chat?.peer;

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
    if (!socket || !chat || !peer) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId: chat._id,
      receiverId: peer._id
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!chat || (!text.trim() && !imageFile)) return;

    setSending(true);
    await onSendMessage(chat, { text, imageFile });
    setText('');
    setImageFile(null);
    emitTyping(false);
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
          <p>{typingState?.chatId === chat._id && typingState?.isTyping ? 'typing...' : formatLastSeen(peer?.lastSeen, peer?.isOnline)}</p>
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
              setText(event.target.value);
              emitTyping(Boolean(event.target.value.trim()));
            }}
            onBlur={() => emitTyping(false)}
            placeholder="Type a message"
          />
        </div>
        <button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
      </form>
    </section>
  );
};

export default ChatWindow;
