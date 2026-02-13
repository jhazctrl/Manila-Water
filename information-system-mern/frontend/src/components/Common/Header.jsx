/**
 * Header Component — Reusable across all pages
 * Props: showSignUp, showBack, showLogout, backTo
 * Logo left, action button right
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ showLogout = false, showBack = false, showSignUp = false, backTo = '/' }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <header className="absolute top-0 left-0 w-full z-30 flex items-center justify-between px-6 py-4">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
                    <img src="/img/logo_sampaloc.png" alt="Sampaloc" className="h-10 w-10 object-contain" />
                    <img src="/img/logo_mnlwater.png" alt="Manila Water" className="h-10 w-10 object-contain" />
                    <div className="text-white font-poppins">
                        <span className="text-sm font-bold tracking-wide">MANILA WATER</span>
                        <br />
                        <span className="text-[10px] tracking-widest">CARE IN EVERY DROP</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {showSignUp && (
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm font-poppins hover:bg-white/20 transition-all duration-200 cursor-pointer"
                        >
                            Sign Up
                        </button>
                    )}
                    {showBack && (
                        <button
                            onClick={() => navigate(backTo)}
                            className="px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm font-poppins hover:bg-white/20 transition-all duration-200 cursor-pointer flex items-center gap-1"
                        >
                            ← Back
                        </button>
                    )}
                    {showLogout && (
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm font-poppins hover:bg-white/20 transition-all duration-200 cursor-pointer"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn font-poppins"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutModal(false); }}
                >
                    <div className="glass-modal rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-slideUp">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Logout</h3>
                        <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
