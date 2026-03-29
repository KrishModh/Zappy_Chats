import { getUserAvatar } from '../utils/avatar';

const UserProfilePanel = ({ chat, onBack }) => {
  const peer = chat?.peer;

  if (!peer) {
    return (
      <section className="chat-panel placeholder-panel">
        <div>
          <h2>Profile unavailable</h2>
          <p>Select a conversation to view that user's profile.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-panel user-profile-panel">
      <header className="chat-header profile-panel-header">
        <button type="button" className="ghost back-home-button" onClick={onBack}>
          ← Back to Chat
        </button>
      </header>

      <div className="user-profile-content">
        <img
          className="user-profile-avatar"
          src={getUserAvatar({ profilePic: peer.profilePic, fullName: peer.fullName, username: peer.username })}
          alt={peer.username}
        />
        <h2>{peer.fullName || peer.username}</h2>
        <p className="user-profile-username">@{peer.username}</p>
      </div>
    </section>
  );
};

export default UserProfilePanel;
