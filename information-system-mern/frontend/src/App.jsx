/**
 * App.jsx — Root application component
 * Routes: Index (public), Login, Signup, UserHomepage, BrgyAdmin, CentralAdmin
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Auth pages
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

// Public pages
import Index from './components/Pages/Index';

// Protected pages
import UserHomepage from './components/Pages/UserHomepage';
import BrgyAdminDashboard from './components/Dashboard/BrgyAdminDashboard';
import CentralAdminDashboard from './components/Dashboard/CentralAdminDashboard';

// Common
import ProtectedRoute from './components/Common/ProtectedRoute';

// Smart redirect: if authenticated, go to correct dashboard
const SmartRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const map = { 1: '/user-homepage', 2: '/barangay-admin', 3: '/central-admin' };
  return <Navigate to={map[user?.role_id] || '/user-homepage'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/user-homepage"
            element={
              <ProtectedRoute requiredRole={1}>
                <UserHomepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/barangay-admin"
            element={
              <ProtectedRoute requiredRole={2}>
                <BrgyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/central-admin"
            element={
              <ProtectedRoute requiredRole={3}>
                <CentralAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<SmartRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
