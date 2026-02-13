/**
 * Header.jsx - Reusable Header Component
 * Used across multiple pages with optional Sign Up/Log In button
 */
import { useNavigate } from 'react-router-dom';

const Header = ({ showSignUp = false, showLogIn = false }) => {
    const navigate = useNavigate();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header className="index-header">
            <div className="index-logo-section" onClick={scrollToTop}>
                <img src="/img/logo_sampaloc.png" alt="Sampaloc" className="index-logo" />
                <img src="/img/logo_mnlwater.png" alt="Manila Water" className="index-logo" />
                <div className="index-logo-text">
                    <h1>MANILA WATER</h1>
                    <p>CARE IN EVERY DROP</p>
                </div>
            </div>
            
            {showSignUp && (
                <button className="index-signup-btn" onClick={() => navigate('/signup')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                    </svg>
                    Sign Up
                </button>
            )}
            
            {showLogIn && (
                <button className="index-signup-btn" onClick={() => navigate('/login')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                    </svg>
                    Log In
                </button>
            )}
        </header>
    );
};

export default Header;
