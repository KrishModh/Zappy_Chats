import { memo } from 'react';
import { formatTime } from '../utils/formatters';

const TickIcon = ({ status }) => {
  if (status === 'read') return <span style={{ color: '#53bdeb' }}>✓✓</span>;
  if (status === 'delivered') return <span style={{ color: '#8696a0' }}>✓✓</span>;
  return <span style={{ color: '#8696a0' }}>✓</span>;
};

const MessageBubble = memo(({ message, isMine }) => (
  <article className={`message-bubble ${isMine ? 'mine' : ''}`}>
    {message.image && <img className="message-image" src={message.image} alt="attachment" />}
    {message.message && <p>{message.message}</p>}
    <span>
      {formatTime(message.timestamp)}
      {isMine && <TickIcon status={message.status} />}
    </span>
  </article>
));

export default MessageBubble;