/**
 * Login.jsx — Glass morphism login page matching wireframe
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../../public/s_login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isAuthenticated, user, loading, error: authError, setError } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated (only after loading completes)
    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            redirectByRole(user.role_id);
        }
    }, [loading, isAuthenticated, user]);

    useEffect(() => {
        return () => setError(null);
    }, [setError]);

    const redirectByRole = (roleId) => {
        switch (roleId) {
            case 1: navigate('/user-homepage'); break;
            case 2: navigate('/barangay-admin'); break;
            case 3: navigate('/central-admin'); break;
            default: navigate('/user-homepage');
        }
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center', color: 'white', fontFamily: "'Poppins', sans-serif" }}>
                    <div className="loader" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect authenticated users immediately (after loading)
    if (!loading && isAuthenticated && user) {
        redirectByRole(user.role_id);
        return null;
    }

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email format';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await login({ email: email.trim().toLowerCase(), password });
            if (response && response.data) {
                redirectByRole(response.data.role_id);
            }
        } catch (err) {
            // Error handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            {/* Header */}
            <header>
                <div className="logo-container">
                    <img src="/img/logo_sampaloc.png" alt="Sampaloc Logo" />
                    <img src="/img/logo_mnlwater.png" alt="Manila Water Logo" />
                </div>
                <Link to="/" className="back-button">← Back</Link>
            </header>

            {/* Glass Login Card */}
            <div className="login-container">
                <img src="/img/logo_mnlwater.png" alt="Manila Water" />
                <h2 style={{ color: 'white', marginBottom: '20px', fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 600 }}>
                    Welcome Back
                </h2>

                {/* Auth Error */}
                {authError && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '15px',
                        fontSize: '13px',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}>
                        {authError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className={errors.email ? 'invalid' : ''}
                    />
                    {errors.email && <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '2px', textAlign: 'left', paddingLeft: '16px' }}>{errors.email}</p>}

                    {/* Password */}
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            className={errors.password ? 'invalid' : ''}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </span>
                    </div>
                    {errors.password && <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '2px', textAlign: 'left', paddingLeft: '16px' }}>{errors.password}</p>}

                    {/* Submit */}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
