import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';

const initialForm = {
  fullName: '',
  username: '',
  password: '',
  phone: '',
  gender: 'other',
  dob: ''
};

const SignupPage = () => {
  const [idToken, setIdToken] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const [form, setForm] = useState(initialForm);
  const [profilePic, setProfilePic] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const debouncedUsername = useDebounce(form.username, 350);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const decodeJwtPayload = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;
    const payload = decodeJwtPayload(token);

    setIdToken(token);
    setGoogleEmail(payload.email || '');
    setForm((f) => ({ ...f, fullName: payload.name || '' }));
    setGoogleName(payload.name || '');
    setError('');
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  useEffect(() => {
    const username = debouncedUsername.trim();
    if (!username) {
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
        setUsernameStatus({ state: 'error', message: 'Unable to check username right now.' });
      });

    return () => { active = false; };
  }, [debouncedUsername]);

  const updateField = (field) => (event) => {
    if (field === 'profilePic') {
      setProfilePic(event.target.files?.[0] || null);
      return;
    }
    setForm((f) => ({ ...f, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!idToken) { setError('Please sign in with Google first.'); return; }

    const s = usernameStatus.state;
    if (s === 'taken' || s === 'checking' || s === 'invalid') return;

    setSubmitting(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('idToken', idToken);
      payload.append('username', form.username);
      payload.append('password', form.password);
      payload.append('phone', form.phone);
      payload.append('gender', form.gender);
      payload.append('dob', form.dob);
      payload.append('fullName', form.fullName);
      if (profilePic) payload.append('profilePic', profilePic);

      const { data } = await api.post('/auth/google-signup', payload);
      setSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card large">
        <span className="chip">Quick & Secure Signup</span>
        <h1>Create your Zappy account</h1>

        {!idToken ? (
          <div className="google-step">
            <p className="muted-copy">
              First, verify your identity with Google. Your email will be pulled automatically.
            </p>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signup_with"
              shape="rectangular"
              theme="filled_blue"
            />
            {error && <p className="error-text">{error}</p>}
            <p className="muted-copy small">Already have an account? <a href="/login" style={{ textDecoration: "underline" }}>Log in</a></p>
          </div>
        ) : (
          <form className="form-grid two-columns" onSubmit={handleSubmit}>
            <div className="helper-panel full-width" style={{ marginBottom: '0.5rem' }}>
              <strong>✅ Google verified:</strong> {googleEmail}
              <p style={{ margin: '0.25rem 0 0' }}>
                Signed in as <em>{googleName}</em>. Fill in the rest of your details below.
              </p>
            </div>

            <label className="form-field">
              <input
                placeholder="Full name"
                value={form.fullName}
                onChange={updateField('fullName')}
                required
              />
              <small className="field-hint">Pre-filled from your Google account. You can change it.</small>
            </label>

            <label className="form-field">
              <input
                placeholder="Choose a unique username"
                value={form.username}
                onChange={updateField('username')}
                required
              />
              <small className="field-hint">Only letters, numbers, underscores or periods. 3–30 chars.</small>
              {usernameStatus.message && (
                <small className={`username-status ${usernameStatus.state}`}>
                  {usernameStatus.message}
                </small>
              )}
            </label>

            {/* Password + Show password checkbox */}
            <label className="form-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={updateField('password')}
              />
              <small className="field-hint">Use 6–8 characters with at least one uppercase letter, number, and special symbol (*, @, $).</small>
              <label className="show-password-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>
            </label>

            <label className="form-field">
              <input
                placeholder="Phone number"
                value={form.phone}
                onChange={updateField('phone')}
                required
              />
              <small className="field-hint">Include your active number for account recovery.</small>
            </label>

            <label className="form-field">
              <input
                type="date"
                value={form.dob}
                onChange={updateField('dob')}
                required
              />
              <small className="field-hint">Select your date of birth.</small>
            </label>

            <label className="form-field">
              <select value={form.gender} onChange={updateField('gender')}>
                <option value="other">Other</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <small className="field-hint">Choose your gender.</small>
            </label>

            <label className="file-field">
              <span>Profile Picture (optional)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={updateField('profilePic')}
              />
              <small className="field-hint">
                Selected: {profilePic?.name || 'No image selected'}
              </small>
            </label>

            {error && <p className="error-text full-width">{error}</p>}

            <button
              type="submit"
              className="full-width"
              disabled={
                submitting ||
                usernameStatus.state === 'taken' ||
                usernameStatus.state === 'checking' ||
                usernameStatus.state === 'invalid'
              }
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>

            <button
              type="button"
              className="full-width"
              style={{ background: 'transparent', color: 'var(--color-muted, #888)', marginTop: '0.25rem' }}
              onClick={() => { setIdToken(''); setGoogleEmail(''); setError(''); }}
            >
              ← Use a different Google account
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default SignupPage;