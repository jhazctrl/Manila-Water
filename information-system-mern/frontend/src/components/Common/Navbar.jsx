/**
 * Navbar — Role-aware navigation
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = { 1: 'Account Holder', 2: 'Barangay Admin', 3: 'Central Admin' };

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-[100] w-full bg-gradient-to-br from-[#0a2e5c] to-[#1a5276] text-white shadow-lg"
            role="navigation" aria-label="Main navigation">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Brand / Logo */}
                    <div className="flex-shrink-0">
                        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
                            <span className="text-2xl group-hover:scale-110 transition-transform">💧</span>
                            <span className="font-bold text-lg tracking-wide">MNL Water Sampaloc</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                    Dashboard
                                </Link>

                                {user.role_id === 1 && (
                                    <>
                                        <Link to="/complaints/new" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                            File Complaint
                                        </Link>
                                        <Link to="/complaints/my" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                            My Complaints
                                        </Link>
                                    </>
                                )}

                                {(user.role_id === 2 || user.role_id === 3) && (
                                    <>
                                        <Link to="/complaints" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                            Complaints
                                        </Link>
                                        <Link to="/advisories" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                            Advisories
                                        </Link>
                                    </>
                                )}

                                <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                    Profile
                                </Link>

                                <div className="flex flex-col items-end border-l border-white/20 pl-4 ml-2">
                                    <span className="text-sm font-semibold leading-none">{user.first_name} {user.last_name}</span>
                                    <span className="text-[10px] opacity-80 leading-none mt-1">{ROLE_LABELS[user.role_id]}</span>
                                </div>

                                <button onClick={handleLogout}
                                    className="ml-4 px-4 py-2 rounded-md text-xs font-bold bg-red-600/80 hover:bg-red-600 transition-colors">
                                    LOGOUT
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="px-4 py-2 rounded-md text-sm font-medium bg-teal-600 hover:bg-teal-500 shadow-md transition-all">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button - Minimum 44px touch target */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none min-h-[44px] min-w-[44px]"
                            aria-expanded={menuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {menuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (Dropdown) */}
            {menuOpen && (
                <div className="md:hidden bg-[#0a2e5c] border-t border-white/10 shadow-xl">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {isAuthenticated ? (
                            <>
                                {/* User Info Mobile */}
                                <div className="px-3 py-3 border-b border-white/10 mb-2">
                                    <div className="font-medium text-base">{user.first_name} {user.last_name}</div>
                                    <div className="text-xs opacity-70">{ROLE_LABELS[user.role_id]}</div>
                                </div>

                                <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                                    className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                    Dashboard
                                </Link>

                                {user.role_id === 1 && (
                                    <>
                                        <Link to="/complaints/new" onClick={() => setMenuOpen(false)}
                                            className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                            File Complaint
                                        </Link>
                                        <Link to="/complaints/my" onClick={() => setMenuOpen(false)}
                                            className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                            My Complaints
                                        </Link>
                                    </>
                                )}

                                {(user.role_id === 2 || user.role_id === 3) && (
                                    <>
                                        <Link to="/complaints" onClick={() => setMenuOpen(false)}
                                            className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                            Complaints
                                        </Link>
                                        <Link to="/advisories" onClick={() => setMenuOpen(false)}
                                            className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                            Advisories
                                        </Link>
                                    </>
                                )}

                                <Link to="/profile" onClick={() => setMenuOpen(false)}
                                    className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                    Profile
                                </Link>

                                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                                    className="w-full text-left mt-2 block px-3 py-3 rounded-md text-base font-medium text-red-300 hover:bg-white/10">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMenuOpen(false)}
                                    className="block px-3 py-3 rounded-md text-base font-medium hover:bg-white/10">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setMenuOpen(false)}
                                    className="block px-3 py-3 rounded-md text-base font-medium bg-teal-700/50 hover:bg-teal-700">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
