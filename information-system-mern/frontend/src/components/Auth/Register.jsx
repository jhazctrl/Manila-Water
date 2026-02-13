/**
 * Register Component
 *
 * Security: Strong password enforcement, real-time validation,
 * password strength indicator, data sanitization
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import locationService from '../../services/location.service';
import { isValidEmail, isStrongPassword, getPasswordStrength, isValidName, passwordsMatch } from '../../utils/validators';
import { sanitizeInput } from '../../utils/sanitizer';

const Register = () => {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        password: '', confirmPassword: '',
        barangayId: '', streetId: '', address: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [barangays, setBarangays] = useState([]);
    const [streets, setStreets] = useState([]);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'None', color: '#ccc' });

    const { register, isAuthenticated, error: authError, setError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => setError(null);
    }, [setError]);

    // Load barangays on mount
    useEffect(() => {
        const loadBarangays = async () => {
            try {
                const res = await locationService.getBarangays();
                if (res.success) setBarangays(res.data);
            } catch (err) {
                console.error('Failed to load barangays:', err);
            }
        };
        loadBarangays();
    }, []);

    // Load streets when barangay changes
    useEffect(() => {
        if (!form.barangayId) { setStreets([]); return; }
        const loadStreets = async () => {
            try {
                const res = await locationService.getStreetsByBarangay(form.barangayId);
                if (res.success) setStreets(res.data);
            } catch (err) {
                console.error('Failed to load streets:', err);
            }
        };
        loadStreets();
    }, [form.barangayId]);

    // Update password strength
    useEffect(() => {
        setPasswordStrength(getPasswordStrength(form.password));
    }, [form.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!isValidName(form.firstName)) newErrors.firstName = 'Valid first name is required';
        if (!isValidName(form.lastName)) newErrors.lastName = 'Valid last name is required';
        if (!isValidEmail(form.email)) newErrors.email = 'Valid email is required';
        if (!isStrongPassword(form.password)) {
            newErrors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character';
        }
        if (!passwordsMatch(form.password, form.confirmPassword)) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!form.barangayId) newErrors.barangayId = 'Please select a barangay';
        if (!form.streetId) newErrors.streetId = 'Please select a street';
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
                firstName: sanitizeInput(form.firstName),
                lastName: sanitizeInput(form.lastName),
                email: sanitizeInput(form.email),
                password: form.password,
                barangayId: parseInt(form.barangayId, 10),
                streetId: parseInt(form.streetId, 10),
                address: sanitizeInput(form.address),
            });
            navigate('/dashboard');
        } catch (err) {
            // Error handled by AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all text-sm";
    const selectClass = "w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all text-sm appearance-none cursor-pointer";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";

    return (
        <div className="min-h-screen font-poppins bg-gradient-to-br from-[#0a2e5c] via-[#1a5276] to-[#148f77] flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-xl bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Manila Water Sampaloc</h1>
                    <p className="text-white/60 text-sm mt-1">Create your account</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <h2 className="text-xl font-semibold text-white text-center">Register</h2>

                    {authError && (
                        <div className="p-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm" role="alert">{authError}</div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className={labelClass}>First Name *</label>
                            <input id="firstName" name="firstName" type="text" value={form.firstName}
                                onChange={handleChange} placeholder="First name" disabled={isSubmitting} autoComplete="given-name" className={inputClass} />
                            {errors.firstName && <span className="text-red-400 text-xs mt-1 block">{errors.firstName}</span>}
                        </div>
                        <div>
                            <label htmlFor="lastName" className={labelClass}>Last Name *</label>
                            <input id="lastName" name="lastName" type="text" value={form.lastName}
                                onChange={handleChange} placeholder="Last name" disabled={isSubmitting} autoComplete="family-name" className={inputClass} />
                            {errors.lastName && <span className="text-red-400 text-xs mt-1 block">{errors.lastName}</span>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className={labelClass}>Email Address *</label>
                        <input id="email" name="email" type="email" value={form.email}
                            onChange={handleChange} placeholder="your@email.com" disabled={isSubmitting} autoComplete="email" className={inputClass} />
                        {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>}
                    </div>

                    <div>
                        <label htmlFor="password" className={labelClass}>Password *</label>
                        <div className="relative">
                            <input id="password" name="password" type={showPassword ? 'text' : 'password'}
                                value={form.password} onChange={handleChange} placeholder="Min 8 chars, upper, lower, number, special"
                                disabled={isSubmitting} autoComplete="new-password" className={inputClass + " pr-12"} />
                            <button type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg p-0 bg-transparent border-none cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {form.password && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-300" style={{
                                        width: `${(passwordStrength.score / 5) * 100}%`,
                                        backgroundColor: passwordStrength.color,
                                    }} />
                                </div>
                                <span className="text-xs font-semibold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                            </div>
                        )}
                        {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password}</span>}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className={labelClass}>Confirm Password *</label>
                        <input id="confirmPassword" name="confirmPassword" type="password"
                            value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password"
                            disabled={isSubmitting} autoComplete="new-password" className={inputClass} />
                        {errors.confirmPassword && <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="barangayId" className={labelClass}>Barangay *</label>
                            <select id="barangayId" name="barangayId" value={form.barangayId}
                                onChange={handleChange} disabled={isSubmitting} className={selectClass}>
                                <option value="">Select Barangay</option>
                                {barangays.map((b) => (
                                    <option key={b.brgy_id} value={b.brgy_id}>{b.brgy_number}</option>
                                ))}
                            </select>
                            {errors.barangayId && <span className="text-red-400 text-xs mt-1 block">{errors.barangayId}</span>}
                        </div>
                        <div>
                            <label htmlFor="streetId" className={labelClass}>Street *</label>
                            <select id="streetId" name="streetId" value={form.streetId}
                                onChange={handleChange} disabled={isSubmitting || !form.barangayId} className={selectClass}>
                                <option value="">Select Street</option>
                                {streets.map((s) => (
                                    <option key={s.street_id} value={s.street_id}>{s.street_name}</option>
                                ))}
                            </select>
                            {errors.streetId && <span className="text-red-400 text-xs mt-1 block">{errors.streetId}</span>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="address" className={labelClass}>Address Detail (Optional)</label>
                        <input id="address" name="address" type="text" value={form.address}
                            onChange={handleChange} placeholder="House no., building, etc."
                            disabled={isSubmitting} autoComplete="street-address" className={inputClass} />
                    </div>

                    <button type="submit" disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-[#1a5276] to-[#148f77] hover:from-[#1a5276]/90 hover:to-[#148f77]/90 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2">
                        {isSubmitting ? 'Creating Account...' : 'Register'}
                    </button>

                    <p className="text-center text-white/60 text-sm mt-4">
                        Already have an account? <Link to="/login" className="text-teal-400 font-semibold hover:underline">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
