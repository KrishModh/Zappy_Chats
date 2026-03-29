import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('Sending OTP...');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { state } = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const otpSent = useRef(false);

  useEffect(() => {
    if (!state?.form?.email) {
      navigate('/signup', { replace: true });
      return;
    }

    // Guard against double-invocation in React Strict Mode
    if (otpSent.current) return;
    otpSent.current = true;

    api
      .post('/auth/send-otp', { email: state.form.email })
      .then(() => setStatus(`OTP sent to ${state.form.email}`))
      .catch((err) => setError(err.response?.data?.message || 'Unable to send OTP.'));
  }, [navigate, state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/auth/verify-otp', { email: state.form.email, otp });
      const payload = new FormData();
      Object.entries(state.form).forEach(([key, value]) => payload.append(key, value));
      payload.append('otp', otp);
      if (state.profilePic) payload.append('profilePic', state.profilePic);
      const { data } = await api.post('/auth/signup', payload);
      setSession(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card narrow">
        <span className="chip">Email verification</span>
        <h1>Verify your OTP</h1>
        <p className="muted-copy">{status}</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Verify & continue'}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
};

export default OTPVerificationPage;