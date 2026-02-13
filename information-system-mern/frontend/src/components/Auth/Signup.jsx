/**
 * Signup.jsx — Glass morphism signup page matching wireframe
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import locationService from '../../services/location.service';
import '../../../public/s_signup.css';

const Signup = () => {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        address: '',
        barangayId: '',
        streetId: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [barangays, setBarangays] = useState([]);
    const [streets, setStreets] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, isAuthenticated, error: authError, setError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate('/user-homepage');
    }, [isAuthenticated]);

    useEffect(() => {
        return () => setError(null);
    }, [setError]);

    // Load barangays on mount
    useEffect(() => {
        const load = async () => {
            try {
                const res = await locationService.getBarangays();
                if (res.success) setBarangays(res.data);
            } catch (err) {
                console.error('Failed to load barangays:', err);
            }
        };
        load();
    }, []);

    // Load streets when barangay changes
    useEffect(() => {
        if (!form.barangayId) { setStreets([]); return; }
        const load = async () => {
            try {
                const res = await locationService.getStreetsByBarangay(form.barangayId);
                if (res.success) setStreets(res.data);
            } catch (err) {
                console.error('Failed to load streets:', err);
            }
        };
        load();
    }, [form.barangayId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!form.address.trim()) newErrors.address = 'Address is required';
        if (!form.barangayId) newErrors.barangayId = 'Barangay is required';
        if (!form.streetId) newErrors.streetId = 'Street is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Invalid email format';
        if (!form.password) newErrors.password = 'Password is required';
        else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await register({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                address: form.address.trim(),
                barangayId: form.barangayId,
                streetId: form.streetId,
            });
            navigate('/user-homepage');
        } catch (err) {
            // Error handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-page">
            {/* Header */}
            <header>
                <div className="logo-container">
                    <img src="/img/logo_sampaloc.png" alt="Sampaloc Logo" />
                    <img src="/img/logo_mnlwater.png" alt="Manila Water Logo" />
                    <div className="header-text">
                        <h1 style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>MANILA WATER</h1>
                        <p style={{ color: 'white', fontSize: '10px', margin: 0, letterSpacing: '1px' }}>CARE IN EVERY DROP</p>
                    </div>
                </div>
                <Link to="/" className="back-button">← Back</Link>
            </header>

            {/* Glass Signup Card */}
            <div className="signup-container">
                <img src="/img/logo_mnlwater.png" alt="Manila Water" />

                {/* Auth Error */}
                {authError && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        fontSize: '13px',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                    }}>
                        {authError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* First Name + Last Name */}
                    <div className="signup-row">
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={form.firstName}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={form.lastName}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Address */}
                    <input
                        type="text"
                        name="address"
                        placeholder="Unit/House No., Floor, Subdivision/Compound"
                        value={form.address}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />

                    {/* Barangay Dropdown */}
                    <div className="custom_select">
                        <select
                            name="barangayId"
                            value={form.barangayId}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        >
                            <option value="">Barangay</option>
                            {barangays.map((b) => (
                                <option key={b.brgy_id} value={b.brgy_id}>
                                    {b.brgy_number || b.brgy_name || `BRGY-${b.brgy_id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Street Dropdown */}
                    <div className="custom_select">
                        <select
                            name="streetId"
                            value={form.streetId}
                            onChange={handleChange}
                            disabled={isSubmitting || !form.barangayId}
                        >
                            <option value="">Street</option>
                            {streets.map((s) => (
                                <option key={s.street_id} value={s.street_id}>
                                    {s.street_name || `Street ${s.street_id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email */}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />

                    {/* Password + Confirm Password */}
                    <div className="signup-row">
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>

                <p>
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
