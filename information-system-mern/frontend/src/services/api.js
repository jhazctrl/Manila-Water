/**
 * Axios API Configuration
 * 
 * Uses relative /api path so Vite proxy forwards to backend.
 * withCredentials for httpOnly cookies, CSRF token handling.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach CSRF token from cookie
api.interceptors.request.use(
    (config) => {
        const csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/signup') {
                    window.location.href = '/login';
                }
            }

            if (status === 429) {
                console.warn('Rate limited:', data.message);
            }

            if (status === 403 && data.message && data.message.includes('CSRF')) {
                window.location.reload();
            }
        }

        return Promise.reject(error);
    }
);

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

export default api;
