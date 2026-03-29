import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { getSocket } from '../socket/socket';
import { getUserAvatar } from '../utils/avatar';
import RequestDropdown from './RequestDropdown';

const Navbar = ({ requests, onRespond }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requestedIds, setRequestedIds] = useState(() => new Set());
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const searchRef = useRef(null);
  const requestRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
      if (!event.target.closest?.('.profile-menu-anchor')) {
        setMenuOpen(false);
      }
      if (!requestRef.current?.contains(event.target)) {
        setShowRequests(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 👇 Existing friends/chats load karo — inhe "Following" dikhana hai
  useEffect(() => {
    if (!isAuthenticated) {
      setFollowingIds(new Set());
      return;
    }

    let active = true;
    api
      .get('/chats')
      .then(({ data }) => {
        if (!active) return;
        const ids = new Set(data.map((chat) => chat.peer?._id).filter(Boolean));
        setFollowingIds(ids);
      })
      .catch(() => {
        if (!active) return;
        setFollowingIds(new Set());
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !debouncedQuery.trim()) {
      setResults([]);
      setSearchOpen(false);
      setSearchMessage('');
      setIsSearching(false);
      return undefined;
    }

    let active = true;
    setIsSearching(true);
    setSearchOpen(true);
    setSearchMessage('');

    api
      .get(`/users/search?query=${encodeURIComponent(debouncedQuery)}`)
      .then(({ data }) => {
        if (!active) return;
        setResults(data);
        setSearchMessage(data.length ? '' : 'No users found.');
      })
      .catch(() => {
        if (!active) return;
        setResults([]);
        setSearchMessage('Search failed. Please try again.');
      })
      .finally(() => {
        if (active) setIsSearching(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, isAuthenticated]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated) return undefined;

    const handleProfileUpdate = (payload) => {
      setResults((current) => current.map((item) => (item._id === payload._id ? { ...item, ...payload } : item)));
    };

    socket.on('profile:update', handleProfileUpdate);
    return () => socket.off('profile:update', handleProfileUpdate);
  }, [isAuthenticated]);

  const sendRequest = async (receiverId) => {
    try {
      await api.post('/chats/requests', { receiverId });
    } catch (error) {
      if (error.response?.status !== 409) {
        setSearchMessage(error.response?.data?.message || 'Unable to send request.');
        return;
      }
    }

    setSearchMessage('');
    setRequestedIds((current) => {
      const next = new Set(current);
      next.add(receiverId);
      return next;
    });
  };

  const badgeCount = requests.length;
  const initials = useMemo(() => user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'Z', [user]);

  return (
    <header className="topbar whatsapp-bar">
      <div className="brand-wrap">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand-link">
          <span className="brand-mark">Z</span>
          <span className="brand-copy">
            <strong>Zappy</strong>
            <small>The new way to connect.</small>
          </span>
        </Link>
        {isAuthenticated && (
          <div className="navbar-search" ref={searchRef}>
            <span className="navbar-search__icon" aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!searchOpen) setSearchOpen(true);
              }}
              onFocus={() => {
                if (query.trim() || results.length) setSearchOpen(true);
              }}
              placeholder="Search people..."
              aria-label="Search users"
            />
            {searchOpen && (query.trim() || isSearching || searchMessage) && (
              <div className="dropdown-card search-dropdown">
                {isSearching && <div className="search-status">Searching...</div>}
                {!isSearching && results.map((result) => {
                  const isFollowing = followingIds.has(result._id);
                  const isRequested = requestedIds.has(result._id);
                  const isDisabled = isFollowing || isRequested;
                  const buttonLabel = isFollowing ? 'Following' : isRequested ? 'Requested' : 'Send Request';

                  return (
                    <article key={result._id} className="search-result-card">
                      <img
                        src={getUserAvatar({ profilePic: result.profilePic, fullName: result.fullName, username: result.username })}
                        alt={result.username}
                      />
                      <div className="search-result-copy">
                        <strong>@{result.username}</strong>
                        <p>{result.fullName}</p>
                      </div>
                      <button
                        type="button"
                        className={`search-request-button ${isFollowing ? 'following' : ''} ${isRequested ? 'requested' : ''}`}
                        onClick={() => { if (!isDisabled) sendRequest(result._id); }}
                        disabled={isDisabled}
                      >
                        {buttonLabel}
                      </button>
                    </article>
                  );
                })}
                {!isSearching && searchMessage && <div className="search-status">{searchMessage}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div className="nav-actions">
          <div className="nav-popover-group" ref={requestRef}>
            <button type="button" className="icon-button nav-action-button" onClick={() => setShowRequests((open) => !open)}>
              <span aria-hidden="true">✉️</span>
              <span>Requests</span>
              {badgeCount > 0 && <span className="badge-dot">{badgeCount}</span>}
            </button>
            <RequestDropdown open={showRequests} requests={requests} onRespond={onRespond} />
          </div>
          <div className="profile-menu-anchor">
            <button type="button" className="profile-pill" onClick={() => setMenuOpen((open) => !open)}>
              <img
                src={getUserAvatar({ profilePic: user?.profilePic, fullName: user?.fullName, username: user?.username })}
                alt={user?.username || initials}
              />
            </button>
            {menuOpen && (
              <div className="dropdown-card profile-dropdown menu-list">
                <strong>{user?.fullName}</strong>
                <p>@{user?.username}</p>
                <button type="button" className="ghost menu-item" onClick={() => navigate('/profile')}>My Profile</button>
                <button type="button" className="ghost menu-item" onClick={() => navigate('/profile?tab=password')}>Change Password</button>
                <button type="button" className="ghost menu-item" onClick={() => navigate('/profile?tab=appearance')}>Appearance</button>
                <button type="button" className="ghost menu-item" onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;