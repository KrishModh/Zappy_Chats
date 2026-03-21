import { memo, useEffect, useRef, useState } from 'react';
import { formatTime } from '../utils/formatters';

const ChatListItem = memo(({ chat, active, unreadCount = 0, onSelect, onViewProfile, onRemoveFriend }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <article className={`chat-list-item-card ${active ? 'active' : ''}`}>
      <button className="chat-list-item" onClick={() => onSelect(chat)} type="button">
        <div className="avatar-wrap">
          <img src={chat.peer?.profilePic || 'https://placehold.co/56x56'} alt={chat.peer?.username || 'User'} />
          <span className={`presence-dot ${chat.peer?.isOnline ? 'online' : ''}`} />
        </div>
        <div className="chat-list-copy">
          <div className="chat-list-row">
            <strong>{chat.peer?.fullName || chat.peer?.username}</strong>
            <span>{formatTime(chat.lastMessageAt)}</span>
          </div>
          <div className="chat-list-row muted">
            <span>@{chat.peer?.username}</span>
            <span className="message-preview">{chat.lastMessage || 'Start chatting'}</span>
          </div>
        </div>
      </button>

      {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
      <div className="chat-item-menu" ref={menuRef}>
        <button
          type="button"
          className="chat-menu-trigger"
          aria-label={`More actions for ${chat.peer?.username || 'user'}`}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="chat-item-dropdown dropdown-card menu-list">
            <button
              type="button"
              className="ghost menu-item"
              onClick={() => {
                setMenuOpen(false);
                onViewProfile(chat);
              }}
            >
              My Profile
            </button>
            <button
              type="button"
              className="ghost menu-item danger-text"
              onClick={() => {
                setMenuOpen(false);
                onRemoveFriend(chat);
              }}
            >
              Remove Friend
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export default ChatListItem;
