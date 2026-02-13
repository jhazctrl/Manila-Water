/**
 * Authentication Context
 * 
 * Provides auth state and functions to entire app via React Context.
 * Security: Clears sensitive data on logout, auto-checks auth on mount.
 */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on mount
    const checkAuth = useCallback(async () => {
        try {
            setLoading(true);
            const response = await authService.getCurrentUser();
            if (response.success) {
                setUser(response.data);
            }
        } catch (err) {
            // Not authenticated — normal case
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (credentials) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.login(credentials);
            if (response.success) {
                setUser(response.data);
                return response;
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);
            const response = await authService.register(userData);
            if (response.success) {
                setUser(response.data);
                return response;
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            // Logout should succeed even if API fails
            console.error('Logout API error:', err);
        } finally {
            setUser(null);
            setError(null);
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        checkAuth,
        setError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
