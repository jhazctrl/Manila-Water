/**
 * Profile Component — View/edit user profile, change password
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import authService from '../../services/auth.service';
import { isStrongPassword, getPasswordStrength } from '../../utils/validators';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

const Profile = () => {
    const { user, checkAuth } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                if (res.data.success) {
                    setProfile(res.data.data);
                    setEditForm(res.data.data);
                }
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', {
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                contact_no: editForm.contact_no,
                address: editForm.address,
            });
            if (res.data.success) {
                setMessage('Profile updated successfully!');
                setEditing(false);
                checkAuth();
                // Reload profile
                const reload = await api.get('/users/profile');
                if (reload.data.success) setProfile(reload.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isStrongPassword(passwordForm.newPassword)) {
            setError('New password must be 8+ chars with uppercase, lowercase, number, and special character');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await authService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setMessage('Password changed successfully!');
            setShowChangePassword(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a2332] font-poppins text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all text-sm";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";
    const btnPrimary = "w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 text-sm";
    const btnSecondary = "w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all shadow-lg active:scale-95 text-sm";

    return (
        <div className="min-h-screen font-poppins bg-[#1a2332] text-white flex flex-col">
            <Header showLogout showBack backTo="/dashboard" />

            <div className="relative pt-28 pb-12 px-4 md:px-8 flex-grow">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <img src="/img/bg_homepage.jpg" alt="Background" className="w-full h-full object-cover opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a2332]/90 to-[#1a2332]" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-2xl shadow-lg">
                                    👤
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">My Profile</h1>
                                    <p className="text-white/60 text-sm">Manage your account settings</p>
                                </div>
                            </div>
                            <span className="inline-block px-4 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                                {['', 'Account Holder', 'Barangay Admin', 'Central Admin'][profile?.role_id]}
                            </span>
                        </div>

                        {message && (
                            <div className="mb-6 p-4 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-2">
                                <span>✓</span> {message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-2">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        {!editing ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Full Name</p>
                                        <p className="font-semibold text-lg">{profile?.first_name} {profile?.last_name}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Email Address</p>
                                        <p className="font-semibold text-lg">{profile?.user_email}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Contact Number</p>
                                        <p className="font-semibold text-lg">{profile?.contact_no || 'Not set'}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Location</p>
                                        <p className="font-semibold text-lg">{profile?.street_name}, {profile?.brgy_number}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-white/5 border border-white/5 md:col-span-2">
                                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Address</p>
                                        <p className="font-semibold text-lg">{profile?.address || 'Not set'}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-white/10">
                                    <button className={btnPrimary} onClick={() => setEditing(true)}>Edit Profile</button>
                                    <button className={btnSecondary} onClick={() => { setShowChangePassword(!showChangePassword); setError(null); }}>
                                        {showChangePassword ? 'Cancel Password Change' : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>First Name</label>
                                        <input type="text" className={inputClass} value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Last Name</label>
                                        <input type="text" className={inputClass} value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Contact Number</label>
                                    <input type="text" className={inputClass} value={editForm.contact_no || ''} onChange={(e) => setEditForm({ ...editForm, contact_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Address</label>
                                    <input type="text" className={inputClass} value={editForm.address || ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
                                    <button type="submit" className={btnPrimary}>Save Changes</button>
                                    <button type="button" className={btnSecondary} onClick={() => { setEditing(false); setEditForm(profile); }}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {showChangePassword && (
                            <div className="mt-10 pt-8 border-t border-white/10 animate-fadeIn">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <span className="text-teal-400">🔒</span> Change Password
                                </h3>
                                <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                                    <div>
                                        <label className={labelClass}>Current Password</label>
                                        <input type="password" className={inputClass} value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} autoComplete="current-password" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>New Password</label>
                                        <input type="password" className={inputClass} value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} autoComplete="new-password" />
                                        {passwordForm.newPassword && (
                                            <div className="mt-2 text-xs">
                                                <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden mb-1">
                                                    <div className="h-full transition-all duration-300" style={{
                                                        width: `${(getPasswordStrength(passwordForm.newPassword).score / 5) * 100}%`,
                                                        backgroundColor: getPasswordStrength(passwordForm.newPassword).color,
                                                    }} />
                                                </div>
                                                <span className="text-white/60">{getPasswordStrength(passwordForm.newPassword).label}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Confirm New Password</label>
                                        <input type="password" className={inputClass} value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} autoComplete="new-password" />
                                    </div>
                                    <button type="submit" className={btnPrimary}>Update Password</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
