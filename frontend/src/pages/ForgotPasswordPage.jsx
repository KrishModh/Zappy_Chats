import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

const extractError = (err) => {
  const data = err.response?.data;
  if (data?.details?.length) return data.details[0].message;
  return data?.message || 'Unable to reset password. Please try again.';
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [idToken, setIdToken] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const decodeJwtPayload = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return {}; }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;
    const payload = decodeJwtPayload(token);
    setIdToken(token);
    setGoogleEmail(payload.email || '');
    setError('');
    setStep(2);
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/google-reset-password', {
        idToken,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      setStatus(data.message);
      setStep(3);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card narrow">
        <span className="chip">Password recovery</span>
        <h1>Forgot Password</h1>

        {/* ── Step 1: Google button ── */}
        {step === 1 && (
          <>
            <p className="muted-copy">Step 1 of 2</p>
            <div className="google-step">
              <p className="muted-copy">
                Verify your identity with Google to reset your password — no OTP needed.
              </p>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                text="signin_with"
                shape="rectangular"
                theme="filled_blue"
              />
              {error && <p className="error-text">{error}</p>}
            </div>
          </>
        )}

        {/* ── Step 2: New password form ── */}
        {step === 2 && (
          <>
            <p className="muted-copy">Step 2 of 2</p>
            <form className="form-grid" onSubmit={handleReset}>
              <div className="helper-panel">
                <strong>✅ Verified:</strong> {googleEmail}
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />

              <label className="show-password-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                style={{ background: 'transparent', color: 'var(--color-muted, #888)' }}
                onClick={() => { setStep(1); setIdToken(''); setGoogleEmail(''); setError(''); }}
              >
                ← Use a different Google account
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div className="reset-success">
            <div className="reset-success__icon">🎉</div>
            <h2 className="reset-success__title">Password Reset!</h2>
            <p className="reset-success__msg">{status}</p>
            <button className="reset-success__btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <Link className="inline-link" to="/login">Back to Login</Link>
        )}
      </div>
    </section>
  );
};

export default ForgotPasswordPage;