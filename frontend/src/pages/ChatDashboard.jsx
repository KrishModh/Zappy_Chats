import { useEffect, useState } from 'react';
import api from '../api/client';
import ChatWindow from './ChatWindow';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../socket/socket';

const ChatDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    const [requestRes, chatRes] = await Promise.all([
      api.get('/chats/requests/received'),
      api.get('/chats')
    ]);
    setRequests(requestRes.data);
    setChats(chatRes.data);
  };

  useEffect(() => {
    if (!user?._id) return;
    connectSocket(user._id);
    load();
  }, [user?._id]);

  const respond = async (requestId, action) => {
    await api.patch(`/chats/requests/${requestId}`, { action });
    load();
  };

  return (
    <div className="dashboard-grid">
      <section className="card">
        <h2>Incoming Requests</h2>
        {requests.map((req) => (
          <article key={req._id} className="list-item">
            <img src={req.sender.profilePic || 'https://via.placeholder.com/45'} alt={req.sender.username} />
            <div>
              <h4>{req.sender.username}</h4>
              <p>{req.sender.fullName}</p>
            </div>
            <button onClick={() => respond(req._id, 'accepted')}>Accept</button>
            <button onClick={() => respond(req._id, 'rejected')}>Reject</button>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Your Chats</h2>
        {chats.map((chat) => {
          const peer = chat.participants.find((p) => p._id !== user._id);
          return (
            <article key={chat._id} className="list-item clickable" onClick={() => setActiveChat(chat)}>
              <img src={peer?.profilePic || 'https://via.placeholder.com/45'} alt={peer?.username} />
              <div>
                <h4>{peer?.username}</h4>
                <p>{peer?.fullName}</p>
              </div>
            </article>
          );
        })}
      </section>

      <ChatWindow chat={activeChat} />
    </div>
  );
};

export default ChatDashboard;
