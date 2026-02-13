/**
 * CentralAdminDashboard.jsx — Central Admin Dashboard
 * Matching the original LAMP wireframe design
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advisoryService from '../../services/advisory.service';
import complaintService from '../../services/complaint.service';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import AddAdvisoryModal from '../Advisories/AddAdvisoryModal';
import '../../css/central_adm_dashboard.css';

const CentralAdminDashboard = () => {
    const { user } = useAuth();
    const [advisories, setAdvisories] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [activeTab, setActiveTab] = useState('advisories');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        upcoming: 0,
        ongoing: 0,
        resolved: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [advRes, compRes] = await Promise.all([
                advisoryService.getAllAdvisories(),
                complaintService.getComplaints()
            ]);
            const advData = advRes.success ? advRes.data : (Array.isArray(advRes) ? advRes : []);
            const compData = compRes.success ? compRes.data : (Array.isArray(compRes) ? compRes : []);
            setAdvisories(advData);
            setComplaints(compData);
            calculateStats(advData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        setStats({
            total: data.length,
            upcoming: data.filter(a => (a.status || '').toLowerCase() === 'upcoming').length,
            ongoing: data.filter(a => (a.status || '').toLowerCase() === 'ongoing').length,
            resolved: data.filter(a => (a.status || '').toLowerCase() === 'resolved').length
        });
    };

    const handleResolve = async (id) => {
        try {
            await advisoryService.resolveAdvisory(id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSetOngoing = async (id) => {
        try {
            await advisoryService.setOngoing(id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleComplaintStatus = async (complaintId, status) => {
        try {
            await complaintService.updateStatus(complaintId, status);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const filteredAdvisories = advisories.filter(a =>
        (a.advisory_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.street_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.brgy_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.advisory_description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date, time) => {
        if (!date) return 'N/A';
        try {
            const d = new Date(date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const formatted = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
            if (time) {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const h12 = hour % 12 || 12;
                return `${formatted}, ${String(h12).padStart(2, '0')}:${m} ${ampm}`;
            }
            return formatted;
        } catch { return String(date); }
    };

    const formatSchedule = (adv) => {
        const start = formatDate(adv.start_date, adv.start_time);
        const end = formatDate(adv.end_date, adv.end_time);
        if (start && end) return `${start} — ${end}`;
        return start || end || 'N/A';
    };

    if (loading) {
        return (
            <div className="central-admin-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white', fontSize: 18, fontFamily: "'Poppins', sans-serif" }}>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="central-admin-dashboard">
            <Header showLogout />

            {/* ═══ HERO SECTION — Official Advisories ═══ */}
            <div className="central-hero-section">
                <div className="central-hero-content">
                    <h1 className="central-page-title">OFFICIAL WATER INTERRUPTION ADVISORIES</h1>
                    <div className="central-search-wrapper">
                        <div className="search-with-button">
                            <input
                                type="text"
                                placeholder="Search advisories..."
                                className="central-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                className="add-advisory-btn"
                                onClick={() => setShowAdvisoryModal(true)}
                            >
                                Add New Advisory
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ MAIN CONTENT — Table + Monitoring ═══ */}
            <div className="central-content-wrapper">

                {/* Advisory Table */}
                <div className="central-table-section">
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
                                    {filteredAdvisories.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                                No advisories found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAdvisories.map((adv, idx) => (
                                            <tr key={adv.advisory_id || idx}>
                                                <td>{adv.advisory_type || 'N/A'}</td>
                                                <td>{adv.advisory_description || 'N/A'}</td>
                                                <td>{formatDate(adv.start_date, adv.start_time)}</td>
                                                <td>{formatDate(adv.end_date, adv.end_time)}</td>
                                                <td>{adv.street_name}, {adv.brgy_number}</td>
                                                <td>
                                                    <span className={`status-badge status-${(adv.status || '').toLowerCase()}`}>
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
                </div>

                {/* Monitoring Dashboard Section */}
                <div className="monitoring-section">
                    <h2 className="monitoring-title">MONITORING DASHBOARD</h2>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">TOTAL ADVISORIES</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">UPCOMING</div>
                            <div className="stat-value">{stats.upcoming}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">ONGOING</div>
                            <div className="stat-value">{stats.ongoing}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">RESOLVED</div>
                            <div className="stat-value">{stats.resolved}</div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                            onClick={() => setActiveTab('complaints')}
                        >
                            Complaints
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'advisories' ? 'active' : ''}`}
                            onClick={() => setActiveTab('advisories')}
                        >
                            Water Interruption Advisories
                        </button>
                    </div>

                    {/* Tab Content — Advisory Management */}
                    {activeTab === 'advisories' ? (
                        <div className="monitoring-table-container">
                            <div className="table-scroll-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>TYPE</th>
                                            <th>LOCATION</th>
                                            <th>STATUS</th>
                                            <th>SCHEDULE</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {advisories.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="no-data">No advisories found.</td>
                                            </tr>
                                        ) : advisories.map((adv, idx) => (
                                            <tr key={adv.advisory_id || idx}>
                                                <td>{advisories.length - idx}</td>
                                                <td>{adv.advisory_type || 'N/A'}</td>
                                                <td>{adv.street_name}, {adv.brgy_number}</td>
                                                <td>
                                                    <span className={`status-badge status-${(adv.status || '').toLowerCase()}`}>
                                                        {adv.status}
                                                    </span>
                                                </td>
                                                <td>{formatSchedule(adv)}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {(adv.status || '').toLowerCase() === 'upcoming' && (
                                                            <>
                                                                <button className="action-btn ongoing-btn" onClick={() => handleSetOngoing(adv.advisory_id)}>Ongoing</button>
                                                                <button className="action-btn resolve-btn" onClick={() => handleResolve(adv.advisory_id)}>Resolve</button>
                                                            </>
                                                        )}
                                                        {(adv.status || '').toLowerCase() === 'ongoing' && (
                                                            <button className="action-btn resolve-btn" onClick={() => handleResolve(adv.advisory_id)}>Resolve</button>
                                                        )}
                                                        {(adv.status || '').toLowerCase() === 'resolved' && (
                                                            <span style={{ color: '#95a5a6', fontStyle: 'italic', fontSize: 13 }}>Resolved</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Tab Content — Complaints */
                        <div className="monitoring-table-container">
                            <div className="table-scroll-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>TYPE</th>
                                            <th>DESCRIPTION</th>
                                            <th>LOCATION</th>
                                            <th>FILED</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {complaints.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="no-data">No complaints found.</td>
                                            </tr>
                                        ) : complaints.map((comp, idx) => (
                                            <tr key={comp.complaint_id || idx}>
                                                <td>{comp.complaint_id}</td>
                                                <td>{comp.complaint_type || 'N/A'}</td>
                                                <td>{comp.complaint_description || 'N/A'}</td>
                                                <td>{comp.street_name || ''}{comp.brgy_number ? `, ${comp.brgy_number}` : ''}</td>
                                                <td>{formatDate(comp.complaint_date)}</td>
                                                <td>
                                                    <span className={`status-badge status-${(comp.status || '').toLowerCase()}`}>
                                                        {comp.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {['pending', 'verified'].includes((comp.status || '').toLowerCase()) ? (
                                                        <select
                                                            className="status-select"
                                                            value={comp.status}
                                                            onChange={(e) => handleComplaintStatus(comp.complaint_id, e.target.value)}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="verified">Verified</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="rejected">Rejected</option>
                                                        </select>
                                                    ) : (
                                                        <span style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            {showAdvisoryModal && (
                <AddAdvisoryModal
                    onClose={() => setShowAdvisoryModal(false)}
                    onSuccess={() => { setShowAdvisoryModal(false); fetchData(); }}
                />
            )}
        </div>
    );
};

export default CentralAdminDashboard;
