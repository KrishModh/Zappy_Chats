import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('Sending OTP...');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (!state?.form?.email) return navigate('/signup');
    api
      .post('/auth/send-otp', { email: state.form.email })
      .then(() => setStatus('OTP sent to your email.'))
      .catch(() => setStatus('Unable to send OTP.'));
  }, [state, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    await api.post('/auth/verify-otp', { email: state.form.email, otp });

    const payload = new FormData();
    Object.entries(state.form).forEach(([key, value]) => payload.append(key, value));
    payload.append('otp', otp);
    if (state.profilePic) payload.append('profilePic', state.profilePic);

    const { data } = await api.post('/auth/signup', payload);
    login(data);
    navigate('/dashboard');
  };

  return (
    <section className="card">
      <h2>Verify OTP</h2>
      <p>{status}</p>
      <form onSubmit={handleVerify} className="form-grid">
        <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" required />
        <button type="submit">Verify & Create Account</button>
      </form>
    </section>
  );
};

export default OTPVerificationPage;
