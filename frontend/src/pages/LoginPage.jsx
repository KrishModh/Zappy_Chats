import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);
      setSession(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <span className="chip">Secure real-time chat</span>
        <h1>Welcome back to Zappy</h1>
        <p className="muted-copy">Experience secure chatting with instant updates and smooth connectivity.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            required
          />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
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
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        {error && <p className="error-text">{error}</p>}
        <Link className="inline-link" to="/forgot-password">Forgot Password?</Link>
        <p className="muted-copy">No account yet? <Link to="/signup" style={{ textDecoration: "underline" }}>Create one</Link></p>
      </div>
    </section>
  );
};

export default LoginPage;