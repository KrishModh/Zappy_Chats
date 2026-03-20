import { memo } from 'react';
import { formatTime } from '../utils/formatters';

const MessageBubble = memo(({ message, isMine }) => (
  <article className={`message-bubble ${isMine ? 'mine' : ''}`}>
    {message.image && <img className="message-image" src={message.image} alt="attachment" />}
    {message.message && <p>{message.message}</p>}
    <span>{formatTime(message.timestamp)} {isMine ? '✓✓' : ''}</span>
  </article>
));

export default MessageBubble;
