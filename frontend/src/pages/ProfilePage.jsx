import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import { getUserAvatar } from '../utils/avatar';
import { useTheme } from '../context/ThemeContext';
import { formatDateInputValue, formatDateOfBirth } from '../utils/formatters';

const tabs = ['profile', 'password', 'appearance'];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { search } = useLocation();
  const navigate = useNavigate();
  const activeTab = useMemo(() => {
    const tab = new URLSearchParams(search).get('tab') || 'profile';
    return tabs.includes(tab) ? tab : 'profile';
  }, [search]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    gender: 'other',
    dob: ''
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });
  const debouncedUsername = useDebounce(profileForm.username, 350);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || 'other',
      dob: formatDateInputValue(user.dob)
    });
  }, [user]);

  useEffect(() => {
    if (!isEditing) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }

    const username = debouncedUsername.trim();
    if (!username || username === user?.username) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(username) || username.length < 3 || username.length > 30) {
      setUsernameStatus({
        state: 'invalid',
        message: 'Username must be 3-30 chars and only use letters, numbers, underscores, or periods.'
      });
      return;
    }

    let active = true;
    setUsernameStatus({ state: 'checking', message: 'Checking username availability...' });
    api
      .get(`/auth/username-availability?username=${encodeURIComponent(username)}`)
      .then(({ data }) => {
        if (!active) return;
        setUsernameStatus(
          data.available
            ? { state: 'available', message: 'Username available.' }
            : { state: 'taken', message: 'Username already taken.' }
        );
      })
      .catch(() => {
        if (!active) return;
        setUsernameStatus({ state: 'error', message: 'Unable to validate username right now.' });
      });

    return () => {
      active = false;
    };
  }, [debouncedUsername, isEditing, user?.username]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (usernameStatus.state === 'checking' || usernameStatus.state === 'taken' || usernameStatus.state === 'invalid') {
      return;
    }
    setSaving(true);
    setStatus('');

    try {
      const payload = new FormData();
      payload.append('fullName', profileForm.fullName);
      payload.append('username', profileForm.username);
      payload.append('phone', profileForm.phone);
      payload.append('gender', profileForm.gender);
      payload.append('dob', profileForm.dob);
      if (profilePic) payload.append('profilePic', profilePic);

      const { data } = await api.put('/users/update-profile', payload);
      updateUser(data.user);
      setStatus('Profile updated successfully.');
      setIsEditing(false);
      setProfilePic(null);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordStatus('');

    try {
      const { data } = await api.post('/auth/change-password', passwordForm);
      setPasswordStatus(data.message);
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (error) {
      setPasswordStatus(error.response?.data?.message || 'Unable to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="page-shell profile-page-shell">
      <div className="profile-layout">
        <aside className="profile-sidebar panel-card">
          <button type="button" className="ghost back-home-button" onClick={() => navigate('/dashboard')}>
            ← Back to Home
          </button>
          <img
            className="profile-hero-avatar"
            src={getUserAvatar({ profilePic: user?.profilePic, fullName: user?.fullName, username: user?.username })}
            alt={user?.username}
          />
          <h2>{user?.fullName}</h2>
          <p>@{user?.username}</p>
          <p className="muted-copy">DOB: {formatDateOfBirth(user?.dob)}</p>
          <nav className="profile-nav-links">
            <Link className={activeTab === 'profile' ? 'active' : ''} to="/profile">My Profile</Link>
            <Link className={activeTab === 'password' ? 'active' : ''} to="/profile?tab=password">Change Password</Link>
            <Link className={activeTab === 'appearance' ? 'active' : ''} to="/profile?tab=appearance">Appearance</Link>
          </nav>
        </aside>

        <div className="profile-content panel-card">
          {activeTab === 'profile' && (
            <form className="form-grid profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-section-header">
                <div>
                  <h2>My Profile</h2>
                  <p>Keep your details up to date across chats, headers, and search results.</p>
                </div>
                <button type="button" className="ghost" onClick={() => setIsEditing((value) => !value)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <label className="file-field">
                <span>Profile Picture</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={!isEditing} onChange={(event) => setProfilePic(event.target.files?.[0] || null)} />
              </label>
              <input value={profileForm.fullName} disabled={!isEditing} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
              <input value={profileForm.username} disabled={!isEditing} onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))} />
              {isEditing && usernameStatus.message && (
                <small className={`username-status ${usernameStatus.state}`}>{usernameStatus.message}</small>
              )}
              <input value={profileForm.email} disabled readOnly />
              <input value={profileForm.phone} disabled={!isEditing} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
              <input type="date" value={profileForm.dob} disabled={!isEditing} onChange={(event) => setProfileForm((current) => ({ ...current, dob: event.target.value }))} />
              <select value={profileForm.gender} disabled={!isEditing} onChange={(event) => setProfileForm((current) => ({ ...current, gender: event.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {isEditing && (
                <button
                  type="submit"
                  disabled={saving || usernameStatus.state === 'checking' || usernameStatus.state === 'taken' || usernameStatus.state === 'invalid'}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              {status && <p className="muted-copy">{status}</p>}
            </form>
          )}

          {activeTab === 'password' && (
            <form className="form-grid profile-form" onSubmit={handleChangePassword}>
              <div className="profile-section-header">
                <div>
                  <h2>Change Password</h2>
                  <p>Verify your current password before setting a new one.</p>
                </div>
              </div>
              <input
                type="password"
                placeholder="Old Password"
                value={passwordForm.oldPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, oldPassword: event.target.value }))}
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
              <button type="submit" disabled={passwordLoading}>{passwordLoading ? 'Updating...' : 'Update Password'}</button>
              <Link className="inline-link" to="/forgot-password">Forgot Password?</Link>
              {passwordStatus && <p className="muted-copy">{passwordStatus}</p>}
            </form>
          )}

          {activeTab === 'appearance' && (
            <div className="form-grid profile-form">
              <div className="profile-section-header">
                <div>
                  <h2>Appearance</h2>
                  <p>Choose how Zappy should look across the app.</p>
                </div>
              </div>
              <div className="appearance-grid">
                <button type="button" className={`appearance-card ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  Light Mode
                </button>
                <button type="button" className={`appearance-card ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  Dark Mode
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
