import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import api from './api/client';
import { useAuth } from './context/AuthContext';

const ChatDashboard = lazy(() => import('./pages/ChatDashboard'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

const App = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();
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

  if (isBootstrapping) {
    return <div className="screen-center">Loading Zappy...</div>;
  }  

  return (
    <Layout requests={requests} onRespond={handleRespond}>
      <Suspense fallback={<div className="screen-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
          <Route path="/verify-otp" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <OTPVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ChatDashboard refreshKey={chatRefreshKey} />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
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
