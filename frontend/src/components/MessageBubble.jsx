import { memo } from 'react';
import { formatMessageStatus, formatTime } from '../utils/formatters';

const MessageBubble = memo(({ message, isMine }) => (
  <article className={`message-bubble ${isMine ? 'mine' : ''}`}>
    {message.image && <img className="message-image" src={message.image} alt="attachment" />}
    {message.message && <p>{message.message}</p>}
    <span className="message-meta">
      <span>{formatTime(message.timestamp)}</span>
      {isMine && <span className={`message-status ${message.status || 'sent'}`}>{formatMessageStatus(message.status)}</span>}
    </span>
  </article>
));

export default MessageBubble;
