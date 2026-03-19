import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useDebounce from '../hooks/useDebounce';
import RequestDropdown from './RequestDropdown';

const Navbar = ({ requests, onRespond }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [requestedIds, setRequestedIds] = useState(() => new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="brand-link">Zappy</Link>
        {isAuthenticated && (
          <div className="navbar-search" ref={searchRef}>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!searchOpen) setSearchOpen(true);
              }}
              onFocus={() => {
                if (query.trim() || results.length) setSearchOpen(true);
              }}
              placeholder="Search users..."
              aria-label="Search users"
            />
            {searchOpen && (query.trim() || isSearching || searchMessage) && (
              <div className="dropdown-card search-dropdown">
                {isSearching && <div className="search-status">Searching...</div>}
                {!isSearching && results.map((result) => {
                  const isRequested = requestedIds.has(result._id);

                  return (
                    <article key={result._id} className="search-result-card">
                      <img src={result.profilePic || 'https://placehold.co/48x48'} alt={result.username} />
                      <div className="search-result-copy">
                        <strong>@{result.username}</strong>
                        <p>{result.fullName}</p>
                      </div>
                      <button
                        type="button"
                        className={`search-request-button ${isRequested ? 'requested' : ''}`}
                        onClick={() => sendRequest(result._id)}
                        disabled={isRequested}
                      >
                        {isRequested ? 'Requested' : 'Send Request'}
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
          <button type="button" className="icon-button" onClick={() => setShowRequests((open) => !open)}>
            Requests
            {badgeCount > 0 && <span className="badge-dot">{badgeCount}</span>}
          </button>
          <button type="button" className="icon-button" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button type="button" className="profile-pill" onClick={() => setMenuOpen((open) => !open)}>
            {user?.profilePic ? <img src={user.profilePic} alt={user.username} /> : <span>{initials}</span>}
          </button>
          {menuOpen && (
            <div className="dropdown-card profile-dropdown">
              <strong>{user?.fullName}</strong>
              <p>@{user?.username}</p>
              <button type="button" className="ghost" onClick={logout}>Logout</button>
            </div>
          )}
          <RequestDropdown open={showRequests} requests={requests} onRespond={onRespond} />
        </div>
      )}
    </header>
  );
};

export default Navbar;
