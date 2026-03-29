import { getUserAvatar } from '../utils/avatar';

const RequestDropdown = ({ open, requests, onRespond }) => {
  if (!open) return null;

  return (
    <div className="dropdown-card request-dropdown">
      <div className="dropdown-header">
        <strong>Chat requests</strong>
        <span>{requests.length} pending</span>
      </div>
      {requests.length === 0 ? (
        <p className="empty-state">No pending requests.</p>
      ) : (
        requests.map((request) => (
          <article key={request._id} className="request-item">
            <img
              src={getUserAvatar({
                profilePic: request.sender.profilePic,
                fullName: request.sender.fullName,
                username: request.sender.username
              })}
              alt={request.sender.username}
            />
            <div>
              <strong>{request.sender.fullName}</strong>
              <p>@{request.sender.username}</p>
            </div>
            <div className="request-actions">
              <button type="button" className="ghost success" onClick={() => onRespond(request._id, 'accepted')}>
                ✅
              </button>
              <button type="button" className="ghost danger" onClick={() => onRespond(request._id, 'rejected')}>
                ❌
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  );
};

export default RequestDropdown;
