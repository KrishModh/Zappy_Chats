import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ChatDashboard from './pages/ChatDashboard';
import LoginPage from './pages/LoginPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import SignupPage from './pages/SignupPage';
import UserSearchPage from './pages/UserSearchPage';

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <ChatDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <UserSearchPage />
          </PrivateRoute>
        }
      />
    </Routes>
  </Layout>
);

export default App;
