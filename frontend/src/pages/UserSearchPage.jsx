import { useState } from 'react';
import api from '../api/client';

const UserSearchPage = () => {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);

  const search = async (value) => {
    setQ(value);
    if (!value.trim()) return setUsers([]);
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(value)}`);
    setUsers(data);
  };

  const sendRequest = async (receiverId) => {
    await api.post('/chats/requests', { receiverId });
    alert('Request sent');
  };

  return (
    <section className="card">
      <h2>User Search</h2>
      <input value={q} onChange={(e) => search(e.target.value)} placeholder="Search by username" />
      <div className="list">
        {users.map((user) => (
          <article key={user._id} className="list-item">
            <img src={user.profilePic || 'https://via.placeholder.com/45'} alt={user.username} />
            <div>
              <h4>{user.username}</h4>
              <p>{user.fullName}</p>
            </div>
            <button onClick={() => sendRequest(user._id)}>Send Request</button>
          </article>
        ))}
      </div>
    </section>
  );
};

export default UserSearchPage;
