/**
 * UserHomepage.jsx — Matches user-homepage wireframe
 * Top half: advisory table on water bg
 * Bottom half: complaints with filing tips + cards + file button
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import FileComplaintModal from '../Complaints/FileComplaintModal';
import api from '../../services/api';
import '../../css/s_homepage.css';
import '../../css/s_tables.css';

const UserHomepage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [advisories, setAdvisories] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [searchAdv, setSearchAdv] = useState('');
    const [searchComp, setSearchComp] = useState('');
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [loadingAdv, setLoadingAdv] = useState(true);
    const [loadingComp, setLoadingComp] = useState(true);

    useEffect(() => {
        fetchAdvisories();
        fetchComplaints();
    }, []);

    const fetchAdvisories = async () => {
        try {
            const res = await api.get('/advisories');
            if (res.data.success) setAdvisories(res.data.data);
        } catch (err) {
            console.error('Failed to load advisories:', err);
        } finally {
            setLoadingAdv(false);
        }
    };

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints/my');
            if (res.data.success) setComplaints(res.data.data);
        } catch (err) {
            console.error('Failed to load complaints:', err);
        } finally {
            setLoadingComp(false);
        }
    };

    const filteredAdv = advisories.filter((a) => {
        // First filter: Only upcoming or ongoing (exclude resolved)
        const now = new Date();
        const startDate = new Date(a.start_date);
        const endDate = new Date(a.end_date);

        const isUpcoming = startDate > now;
        const isOngoing = startDate <= now && endDate >= now;

        // If status is explicitly set, use it; otherwise derive from dates
        const status = (a.status || '').toLowerCase();
        const isActive = status === 'upcoming' || status === 'ongoing' || isUpcoming || isOngoing;
        const isResolved = status === 'resolved';

        if (isResolved || !isActive) return false;

        // Second filter: Search query
        const searchLower = searchAdv.toLowerCase();
        return (
            (a.street_name || '').toLowerCase().includes(searchLower) ||
            (a.brgy_number || '').toLowerCase().includes(searchLower) ||
            (a.advisory_description || '').toLowerCase().includes(searchLower)
        );
    });

    const filteredComp = complaints.filter(
        (c) =>
            (c.description || '').toLowerCase().includes(searchComp.toLowerCase()) ||
            (c.water_problem_type || '').toLowerCase().includes(searchComp.toLowerCase()) ||
            (c.status || '').toLowerCase().includes(searchComp.toLowerCase())
    );

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'upcoming') return 'status-upcoming';
        if (s === 'ongoing') return 'status-ongoing';
        if (s === 'resolved') return 'status-resolved';
        return '';
    };

    const getCompStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending') return 'status-pending';
        if (s === 'verified') return 'status-verified';
        if (s === 'resolved') return 'status-resolved';
        if (s === 'rejected') return 'status-rejected';
        return '';
    };

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

    const formatComplaintDate = (date) => {
        if (!date) return '';
        try {
            const d = new Date(date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} - ${h12}:${m} ${ampm}`;
        } catch { return date; }
    };

    const handleComplaintSuccess = () => {
        setShowComplaintModal(false);
        fetchComplaints();
    };

    return (
        <div className="user-homepage" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* ═══ HEADER (Outside sections so it's always visible) ═══ */}
            <Header showLogout />

            {/* ═══ TOP SECTION: Advisory ═══ */}
            <section className="advisory-section">
                <h2>WATER INTERRUPTION ADVISORIES</h2>

                {/* Search Bar */}
                <div className="controls-container">
                    <img src="/img/ic_search.jpg" alt="Search" style={{ width: 18, filter: 'brightness(0) invert(1)' }} />
                    <input
                        type="text"
                        placeholder="Type in Barangay / Address for report check"
                        value={searchAdv}
                        onChange={(e) => setSearchAdv(e.target.value)}
                    />
                </div>

                {/* Advisory Table */}
                <div className="table-container">
                    <div className="table-scroll-wrapper">
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
                                {loadingAdv ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>
                                            <div className="loading">
                                                <div className="loader"></div>
                                                <div className="loading-text">Loading advisories...</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAdv.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                                            No advisories found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdv.map((adv, idx) => (
                                        <tr key={adv.advisory_id || idx}>
                                            <td>{adv.advisory_type || 'Water Quality'}</td>
                                            <td>{adv.advisory_description}</td>
                                            <td>{formatDate(adv.start_date, adv.start_time)}</td>
                                            <td>{formatDate(adv.end_date, adv.end_time)}</td>
                                            <td>{adv.street_name}, {adv.brgy_number}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(adv.status)}`}>
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

            {/* ═══ BOTTOM SECTION: Complaints (title left, search right; then two-column) ═══ */}
            <section className="reports-section">
                <div className="reports-layout reports-layout--complaints">
                    {/* Complaints header: title LEFT, search RIGHT (same row) */}
                    <div className="complaints-section-header">
                        <div className="complaints-title-group">
                            <h2 className="complaints-section-title">Complaints</h2>
                        </div>
                        <div className="complaints-header-search">
                            <div className="report-search">
                                <img src="/img/ic_search.jpg" alt="Search" style={{ filter: 'brightness(0) invert(1)' }} />
                                <input
                                    type="text"
                                    placeholder="Type in Barangay / Address for report check"
                                    value={searchComp}
                                    onChange={(e) => setSearchComp(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Two-column: left = Filing Tips (~25–30%), right = Cards grid (~70–75%) */}
                    <div className="complaints-two-col">
                        <aside className="complaints-sidebar">
                            <div className="filing-tips-box">
                                <h3>ℹ Manila Water Sampaloc Filing Tips</h3>
                                <ul>
                                    <li>📍 Provide your <strong>complete address</strong> so we can locate and assist you quickly.</li>
                                    <li>🔧 Select the <strong>correct problem type</strong> (e.g., no water, low pressure).</li>
                                    <li>✅ Use the "Others" option only if needed, and clearly <strong>describe the issue</strong>.</li>
                                    <li>⏱ Indicate <strong>how long the issue has been happening</strong>.</li>
                                    <li>📸 Upload a <strong>clear photo</strong> (e.g., meter, faucet, discolored water) if available.</li>
                                </ul>
                                <p className="filing-tips-note">
                                    These tips help our Sampaloc team address your concern more efficiently. Thank you for your cooperation!
                                </p>
                            </div>
                        </aside>

                        <div className="complaints-cards-area">
                            <div className="report-box complaints-cards-box">
                                {loadingComp ? (
                                    <div className="complaints-loading-inline">Loading...</div>
                                ) : filteredComp.length === 0 ? (
                                    <div className="complaints-empty-inline">
                                        <p className="complaints-empty-title">No complaints filed yet.</p>
                                        <p className="complaints-empty-sub">Click "File a complaint" to submit your first report.</p>
                                    </div>
                                ) : (
                                    <div className="complaint-cards-grid">
                                        {filteredComp.map((comp, idx) => (
                                            <div key={comp.complaint_id || idx} className="complaint-card-item">
                                                <div className="complaint-card-image-wrap">
                                                    {comp.supporting_img ? (
                                                        <img
                                                            src={`/uploads/${comp.supporting_img}`}
                                                            alt="Complaint"
                                                            className="complaint-card-img"
                                                        />
                                                    ) : (
                                                        <div className="complaint-card-placeholder">
                                                            <img src="/img/ic_imgPlaceholder.png" alt="" className="complaint-card-placeholder-icon" />
                                                        </div>
                                                    )}
                                                    <span className={`complaint-card-badge ${getCompStatusClass(comp.status)}`}>
                                                        {comp.status}
                                                    </span>
                                                </div>
                                                <div className="complaint-card-body">
                                                    <p className="complaint-card-id">{comp.complaint_id}</p>
                                                    <p className="complaint-card-date">{formatComplaintDate(comp.complaint_date || comp.created_at)}</p>
                                                    <div className="complaint-card-meta">
                                                        <span className="complaint-card-icon">📍</span>
                                                        <span className="complaint-card-location">
                                                            {[comp.address_detail, comp.street_name, comp.brgy_number].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                    <div className="complaint-card-meta">
                                                        <span className="complaint-card-icon">👤</span>
                                                        <span>{comp.submitted_by || user?.first_name || 'You'}</span>
                                                    </div>
                                                    <p className="complaint-card-type">{comp.complaint_type || comp.water_problem_type || 'Water quality issue'}</p>
                                                    <p className="complaint-card-desc">{comp.complaint_description || comp.description || 'No description provided.'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* File a complaint — floating bottom-right */}
                <button
                    type="button"
                    className="file-complaint-fab"
                    onClick={() => setShowComplaintModal(true)}
                    aria-label="File a complaint"
                >
                    File a complaint
                </button>
            </section>

            <Footer />

            {/* Complaint Modal */}
            {showComplaintModal && (
                <FileComplaintModal
                    onClose={() => setShowComplaintModal(false)}
                    onSuccess={handleComplaintSuccess}
                />
            )}
        </div>
    );
};

export default UserHomepage;
