import { useEffect, useMemo, useRef, useState } from 'react';
import ImageViewerModal from '../components/ImageViewerModal';
import MessageActionModal from '../components/MessageActionModal';
import MessageBubble from '../components/MessageBubble';
import { getSocket } from '../socket/socket';
import { formatDateSeparator, formatLastSeen } from '../utils/formatters';

const TYPING_STOP_DELAY = 1500;
const MESSAGE_ACTION_TIME_LIMIT = 5 * 60 * 1000;
const MESSAGE_ACTION_TIME_LIMIT_TEXT = 'You can only edit or delete messages within 5 minutes of sending.';

const ChatWindow = ({ chat, currentUserId, onBack, messages, onSendMessage, onEditMessage, onDeleteMessage, typingState }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [viewerImage, setViewerImage] = useState(null);
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
    setViewerImage(null);
  }, [chat?._id]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    const targetMessage = messages.find((message) => message._id === editingMessageId);
    if (!targetMessage) {
      setEditingMessageId('');
      setEditingValue('');
    }
  }, [editingMessageId, messages]);

  const openNotice = (message) => {
    setActionMessage(null);
    setNoticeMessage(message);
  };

  const withinEditWindow = (message) => Date.now() - new Date(message.timestamp).getTime() <= MESSAGE_ACTION_TIME_LIMIT;

  const startEditing = (message) => {
    if (!message.message || message.isDeleted) {
      openNotice('Only non-deleted text messages can be edited.');
      return;
    }

    if (!withinEditWindow(message)) {
      openNotice(MESSAGE_ACTION_TIME_LIMIT_TEXT);
      return;
    }

    setActionMessage(null);
    setEditingMessageId(message._id);
    setEditingValue(message.message);
  };

  const handleDeleteAction = async (scope) => {
    if (!actionMessage) {
      return;
    }

    if (scope === 'everyone' && !withinEditWindow(actionMessage)) {
      openNotice(MESSAGE_ACTION_TIME_LIMIT_TEXT);
      return;
    }

    try {
      await onDeleteMessage({ messageId: actionMessage._id, scope, chatId: actionMessage.chatId });
      setActionMessage(null);
      if (editingMessageId === actionMessage._id) {
        setEditingMessageId('');
        setEditingValue('');
      }
    } catch (error) {
      openNotice(error.response?.data?.message || 'Unable to update the message right now.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId) {
      return;
    }

    const targetMessage = messages.find((message) => message._id === editingMessageId);
    if (!targetMessage) {
      setEditingMessageId('');
      setEditingValue('');
      return;
    }

    if (!withinEditWindow(targetMessage)) {
      openNotice(MESSAGE_ACTION_TIME_LIMIT_TEXT);
      return;
    }

    try {
      await onEditMessage(editingMessageId, editingValue);
      setEditingMessageId('');
      setEditingValue('');
    } catch (error) {
      openNotice(error.response?.data?.message || 'Unable to edit the message right now.');
    }
  };

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

  const actionOptions = actionMessage
    ? [
        ...(actionMessage.sender?.toString?.() === currentUserId || actionMessage.sender === currentUserId
          ? [
              { label: 'Delete for everyone', tone: 'danger', onClick: () => handleDeleteAction('everyone') },
              { label: 'Delete for me', tone: 'danger', onClick: () => handleDeleteAction('me') },
              { label: 'Edit message', onClick: () => startEditing(actionMessage) }
            ]
          : [{ label: 'Delete for me', tone: 'danger', onClick: () => handleDeleteAction('me') }]),
        { label: 'Cancel', onClick: () => setActionMessage(null) }
      ]
    : [];

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
              isEditing={editingMessageId === item.value._id}
              editValue={editingValue}
              onEditChange={setEditingValue}
              onEditCancel={() => {
                setEditingMessageId('');
                setEditingValue('');
              }}
              onEditSave={handleSaveEdit}
              onOpenActions={setActionMessage}
              onOpenImageViewer={setViewerImage}
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

      <ImageViewerModal image={viewerImage} onClose={() => setViewerImage(null)} />
      <MessageActionModal
        open={Boolean(actionMessage)}
        title="Message actions"
        description="Choose what you want to do with this message."
        actions={actionOptions}
        onClose={() => setActionMessage(null)}
      />
      <MessageActionModal
        open={Boolean(noticeMessage)}
        title="Action unavailable"
        description={noticeMessage}
        actions={[{ label: 'OK', onClick: () => setNoticeMessage('') }]}
        onClose={() => setNoticeMessage('')}
      />
    </section>
  );
};

export default ChatWindow;
