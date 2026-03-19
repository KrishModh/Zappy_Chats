import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import api from './api/client';
import { useAuth } from './context/AuthContext';

const ChatDashboard = lazy(() => import('./pages/ChatDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

const App = () => {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  const loadRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setRequests([]);
      return;
    }

    const { data } = await api.get('/chats/requests/received');
    setRequests(data);
  }, [isAuthenticated]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleRespond = async (requestId, action) => {
    await api.patch(`/chats/requests/${requestId}`, { action });
    await loadRequests();
    setChatRefreshKey((value) => value + 1);
  };

  return (
    <Layout requests={requests} onRespond={handleRespond}>
      <Suspense fallback={<div className="screen-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ChatDashboard refreshKey={chatRefreshKey} />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default App;
