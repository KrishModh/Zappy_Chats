import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import useDebounce from '../hooks/useDebounce';

const initialForm = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  phone: '',
  gender: 'other',
  dob: ''
};

const SignupPage = () => {
  const [form, setForm] = useState(initialForm);
  const [profilePic, setProfilePic] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });
  const debouncedUsername = useDebounce(form.username, 350);
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    const value = field === 'profilePic' ? event.target.files?.[0] || null : event.target.value;
    if (field === 'profilePic') {
      setProfilePic(value);
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
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

    return () => {
      active = false;
    };
  }, [debouncedUsername]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (usernameStatus.state === 'taken' || usernameStatus.state === 'checking' || usernameStatus.state === 'invalid') {
      return;
    }
    navigate('/verify-otp', { state: { form, profilePic } });
  };

  return (
    <section className="auth-shell">
      <div className="auth-card large">
        <span className="chip">Quick & Secure Signup</span>
        <h1>Create your Zappy account</h1>
        <form className="form-grid two-columns" onSubmit={handleSubmit}>
          <label className="form-field">
            <input placeholder="Enter your full name" value={form.fullName} onChange={updateField('fullName')} required />
            <small className="field-hint">Use your real name so people can identify you easily.</small>
          </label>
          <label className="form-field">
            <input type="email" placeholder="Enter your email (OTP will be sent)" value={form.email} onChange={updateField('email')} required />
            <small className="field-hint">A one-time verification code will be sent to this email.</small>
          </label>
          <label className="form-field">
            <input placeholder="Choose a unique username" value={form.username} onChange={updateField('username')} required />
            <small className="field-hint">Only letters, numbers, underscores allowed.</small>
            {usernameStatus.message && (
              <small className={`username-status ${usernameStatus.state}`}>{usernameStatus.message}</small>
            )}
          </label>
          <label className="form-field">
            <input type="password" placeholder="Create a strong password" value={form.password} onChange={updateField('password')} required />
            <small className="field-hint">Use 6–8 characters with at least one uppercase letter, number, and special symbol (*, @, $).</small>
          </label>
          <label className="form-field">
            <input placeholder="Enter your phone number" value={form.phone} onChange={updateField('phone')} required />
            <small className="field-hint">Include your active number for account recovery.</small>
          </label>
          <label className="form-field">
            <input type="date" value={form.dob} onChange={updateField('dob')} required />
            <small className="field-hint">Select your date of birth.</small>
          </label>
          <label className="form-field">
            <select value={form.gender} onChange={updateField('gender')}>
              <option value="other">Other</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <small className="field-hint">Choose Your Gender.</small>
          </label>
          <label className="file-field">
            <span>Profile Picture</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={updateField('profilePic')} />
            <small className="field-hint">Upload your profile photo (optional).</small>
          </label>
          <div className="helper-panel">
            <strong>Before you continue</strong>
            <p>Zappy will send a 6-digit code to your email and only create the account after verification.</p>
            <p>Selected image: {profilePic?.name || 'No image selected'}</p>
          </div>
          <button
            type="submit"
            className="full-width"
            disabled={usernameStatus.state === 'taken' || usernameStatus.state === 'checking' || usernameStatus.state === 'invalid'}
          >
            Continue to OTP verification
          </button>
        </form>
      </div>
    </section>
  );
};

export default SignupPage;
