import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    const value = field === 'profilePic' ? event.target.files?.[0] || null : event.target.value;
    if (field === 'profilePic') {
      setProfilePic(value);
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // 👈 ye validation add karo
    const { password } = form;
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      alert('Password must include uppercase, lowercase, and a number.');
      return;
    }

    navigate('/verify-otp', { state: { form, profilePic } });
  };

  return (
    <section className="auth-shell">
      <div className="auth-card large">
        <span className="chip">OTP signup + Cloudinary avatar</span>
        <h1>Create your Zappy account</h1>
        <form className="form-grid two-columns" onSubmit={handleSubmit}>
          <input placeholder="Full Name" value={form.fullName} onChange={updateField('fullName')} required />
          <input type="email" placeholder="Email" value={form.email} onChange={updateField('email')} required />
          <input placeholder="Username" value={form.username} onChange={updateField('username')} required />
          <input type="password" placeholder="Password" value={form.password} onChange={updateField('password')} required />
          <input placeholder="Phone Number" value={form.phone} onChange={updateField('phone')} required />
          <input type="date" value={form.dob} onChange={updateField('dob')} required />
          <select value={form.gender} onChange={updateField('gender')}>
            <option value="other">Other</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <label className="file-field">
            <span>Profile Picture</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={updateField('profilePic')} />
          </label>
          <div className="helper-panel">
            <strong>Before you continue</strong>
            <p>Zappy will send a 6-digit code to your email and only create the account after verification.</p>
            <p>Selected image: {profilePic?.name || 'No image selected'}</p>
          </div>
          <button type="submit" className="full-width">Continue to OTP verification</button>
        </form>
      </div>
    </section>
  );
};

export default SignupPage;
