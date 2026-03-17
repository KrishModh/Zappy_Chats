import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('zappy_token');
    if (token) {
      api.get('/users/me').then((res) => setUser(res.data)).catch(() => localStorage.removeItem('zappy_token'));
    }
  }, []);

  const login = (payload) => {
    localStorage.setItem('zappy_token', payload.token);
    setUser(payload.user);
  };

  const logout = () => {
    localStorage.removeItem('zappy_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
