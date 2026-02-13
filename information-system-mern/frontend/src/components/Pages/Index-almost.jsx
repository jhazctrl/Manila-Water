/**
 * Index.jsx – Public Landing Page
 * Hero section with full-screen background, centered logo/branding
 * Advisories section with table and search functionality
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Common/Header';
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

    return (
        <div className="index-page">
            {/* ═══ HEADER ═══ */}
            <Header showSignUp={true} />

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
                                    <th>TYPE</th>
                                    <th>DESCRIPTION</th>
                                    <th>START</th>
                                    <th>END</th>
                                    <th>LOCATION</th>
                                    <th>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="table-empty">Loading advisories...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="table-empty">No advisories found matching your search.</td></tr>
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

            {/* ═══ FOOTER ═══ */}
            <Footer />
        </div>
    );
};

export default Index;
