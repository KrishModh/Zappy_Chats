import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    gender: 'other'
  });
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate('/verify-otp', { state: { form, profilePic } });
  };

  return (
    <section className="card">
      <h2>Signup</h2>
      <form onSubmit={submit} className="form-grid">
        <input placeholder="Full Name" required onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input type="email" placeholder="Email" required onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Username" required onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input type="password" placeholder="Password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Phone Number" required onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="other">Other</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />
        <button type="submit">Continue to OTP</button>
      </form>
      <p className="small">Selected image: {profilePic?.name || 'None'}</p>
    </section>
  );
};

export default SignupPage;
