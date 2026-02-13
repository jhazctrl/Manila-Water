/**
 * ProtectedRoute — Role-based access control
 * Redirects unauthenticated users to /login
 * Redirects to correct dashboard if user has wrong role
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a2332] font-poppins">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-teal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/70 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check — redirect to correct dashboard if wrong role
    if (requiredRole && user) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role_id)) {
            const dashboardMap = {
                1: '/user-homepage',
                2: '/barangay-admin',
                3: '/central-admin',
            };
            return <Navigate to={dashboardMap[user.role_id] || '/login'} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
