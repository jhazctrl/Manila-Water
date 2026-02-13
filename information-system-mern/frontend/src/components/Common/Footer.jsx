/**
 * Footer Component — Matches specific CSS requirements
 */
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Logo Section */}
                <div className="footer-logo-section">
                    <img src="/img/logo_sampaloc.png" alt="Sampaloc" className="footer-logo" />
                    <img src="/img/logo_mnlwater.png" alt="Manila Water" className="footer-logo" />
                    <div className="footer-text">
                        <h3>MANILA WATER</h3>
                        <p>CARE IN EVERY DROP</p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="footer-contact">
                    <p>MWSS Administration Building 489</p>
                    <p>Katipunan Road, Balara Quezon City</p>
                    <p>Philippines 1105</p>
                    <p className="hotline">Hotline: 1627 | (02) 8403 2410</p>

                    <div className="footer-social">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
                            <img src="/img/ic_facebook.png" alt="Facebook" />
                        </a>
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-icon">
                            <img src="/img/ic_twitter.png" alt="Twitter" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                &copy; 2026 Manila Water - Sampaloc. All Rights Reserved.
            </div>
        </footer>
    );
};

export default Footer;
