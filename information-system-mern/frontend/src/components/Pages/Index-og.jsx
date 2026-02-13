/**
 * Index.jsx — Public Landing Page
 * Hero section with full-screen background, centered logo/branding, "Sign Up" button
 * Advisories section with table
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../Common/Footer';
import api from '../../services/api';
import '../../../public/css/s_index.css';

const Index = () => {
    const [advisories, setAdvisories] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdvisories = async () => {
            try {
                const res = await api.get('/advisories/public');
                if (res.data.success) setAdvisories(res.data.data);
            } catch (err) {
                console.error('Failed to load advisories:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdvisories();
    }, []);

    const filtered = advisories.filter(
        (a) =>
            (a.street_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.brgy_number || '').toLowerCase().includes(search.toLowerCase()) ||
            (a.advisory_description || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (date, time) => {
        if (!date) return '';
        try {
            const d = new Date(date);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formatted = `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
            if (time) {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const h12 = hour % 12 || 12;
                return `${formatted}, ${String(h12).padStart(2, '0')}:${m} ${ampm}`;
            }
            return formatted;
        } catch { return date; }
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="index-page">
            {/* ═══ HEADER ═══ */}
            <header className="index-header">
                <div className="index-logo-section" onClick={scrollToTop}>
                    <img src="/img/logo_sampaloc.png" alt="Sampaloc" className="index-logo" />
                    <img src="/img/logo_mnlwater.png" alt="Manila Water" className="index-logo" />
                    <div className="index-logo-text">
                        <h1>MANILA WATER</h1>
                        <p>CARE IN EVERY DROP</p>
                    </div>
                </div>
                <button className="index-signup-btn" onClick={() => navigate('/signup')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" />
                    </svg>
                    Sign Up
                </button>
            </header>

            {/* ═══ HERO SECTION ═══ */}
            <section className="index-hero">
                <div className="index-hero-bg">
                    <img src="/img/bg_homepage.jpg" alt="Background" />
                    <div className="index-hero-overlay"></div>
                </div>
                <div className="index-hero-content">
                    <img src="/img/logo_main.png" alt="Manila Water Logo" className="index-hero-logo" />
                </div>
            </section>

            {/* ═══ ADVISORIES SECTION ═══ */}
            <section className="index-advisories-section">
                <h2 className="advisories-section-title">WATER INTERRUPTION ADVISORIES</h2>

                {/* Search */}
                <div className="advisories-search-wrapper">
                    <div className="advisories-search-bar">
                        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Type in Barangay / Address for report check"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Advisory Table */}
                <div className="advisories-table-container">
                    <div className="advisories-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="table-empty">Loading...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">No advisories found.</td></tr>
                                ) : (
                                    filtered.map((adv, idx) => (
                                        <tr key={adv.advisory_id || idx}>
                                            <td>{adv.advisory_type || 'Water Quality'}</td>
                                            <td className="advisory-desc" title={adv.advisory_description}>
                                                {adv.advisory_description}
                                            </td>
                                            <td className="advisory-date">{formatDate(adv.start_date, adv.start_time)}</td>
                                            <td className="advisory-date">{formatDate(adv.end_date, adv.end_time)}</td>
                                            <td>{adv.street_name}, {adv.brgy_number}</td>
                                            <td>
                                                <span className={`status-pill status-${(adv.status || '').toLowerCase()}`}>
                                                    {adv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Index;
