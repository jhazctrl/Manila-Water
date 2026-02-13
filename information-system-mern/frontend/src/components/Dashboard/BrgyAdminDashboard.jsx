import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Common/Header';
import Footer from '../Common/Footer';
import ComplaintCard from '../Complaints/ComplaintCard';
import api from '../../services/api';
import '../../css/brgy_adm_dashboard.css';
import '../../css/s_tables.css';

const BrgyAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Data states
    const [advisories, setAdvisories] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        verified: 0,
        ongoing: 0,
        resolved: 0,
        rejected: 0
    });

    // UI states
    const [searchAdv, setSearchAdv] = useState('');
    const [searchComp, setSearchComp] = useState('');
    const [complaintsTab, setComplaintsTab] = useState('pending'); // 'pending' | 'completed'
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const advRes = await api.get('/advisories');
            if (advRes.data.success) {
                setAdvisories(advRes.data.data);
            }

            const compRes = await api.get('/complaints/brgy');
            if (compRes.data.success) {
                const compData = compRes.data.data;
                setComplaints(compData);
                calculateStats(compData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const pendingList = data.filter(c => c.status === 'Pending');
        const pendingNew24 = pendingList.filter(c => {
            const created = new Date(c.created_at || c.complaint_date).getTime();
            return (now - created) < oneDayMs;
        }).length;
        setStats({
            total: data.length,
            pending: pendingList.length,
            pendingNew24,
            verified: data.filter(c => c.status === 'Verified').length,
            ongoing: data.filter(c => c.status === 'Ongoing').length,
            resolved: data.filter(c => c.status === 'Resolved').length,
            rejected: data.filter(c => c.status === 'Rejected').length
        });
    };

    const handleComplaintAction = async (id, action) => {
        if (action === 'reject') {
            if (!window.confirm('Are you sure you want to reject this complaint?')) return;
        }

        setActionLoading(id);
        try {
            const endpoint = action === 'verify'
                ? `/complaints/${id}/verify`
                : `/complaints/${id}/reject`;
            const newStatus = action === 'verify' ? 'Verified' : 'Rejected';

            const res = await api.put(endpoint);
            if (res.data.success) {
                const updated = complaints.map(c =>
                    c.complaint_id === id ? { ...c, status: newStatus } : c
                );
                setComplaints(updated);
                calculateStats(updated);
            }
        } catch (error) {
            console.error(`${action} failed:`, error);
            alert(`Failed to ${action} complaint`);
        } finally {
            setActionLoading(null);
        }
    };

    // Filter & Sort
    const filteredAdvisories = advisories.filter(a =>
        (a.street_name || '').toLowerCase().includes(searchAdv.toLowerCase()) ||
        (a.brgy_number || '').toLowerCase().includes(searchAdv.toLowerCase())
    );

    const filteredComplaints = complaints
        .filter(c => {
            const matchSearch =
                (c.complaint_id || '').toLowerCase().includes(searchComp.toLowerCase()) ||
                (c.description || '').toLowerCase().includes(searchComp.toLowerCase()) ||
                (c.complaint_type || '').toLowerCase().includes(searchComp.toLowerCase()) ||
                (c.status || '').toLowerCase().includes(searchComp.toLowerCase());
            if (!matchSearch) return false;
            const isCompleted = ['Resolved', 'Rejected', 'Verified'].includes(c.status);
            if (complaintsTab === 'pending') return !isCompleted;
            return isCompleted;
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at || a.complaint_date);
            const dateB = new Date(b.created_at || b.complaint_date);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="brgy-admin-dashboard">
            <Header showLogout />

            {/* ═══ SECTION 1: ADVISORIES ═══ */}
            <section className="brgy-advisories-section">
                <div className="brgy-hero-bg">
                    <img src="/img/bg_advisory.jpg" alt="Background" />
                    <div className="brgy-overlay"></div>
                </div>

                <div className="brgy-advisories-content">
                    <h2>WATER INTERRUPTION ADVISORIES</h2>

                    {/* Search */}
                    <div className="controls-container">
                        <img src="/img/ic_search.jpg" alt="Search" style={{ filter: 'brightness(0) invert(1)' }} />
                        <input
                            type="text"
                            placeholder="Search Barangay / Location..."
                            value={searchAdv}
                            onChange={(e) => setSearchAdv(e.target.value)}
                        />
                    </div>

                    {/* Table */}
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
                                            <td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No advisories found</td>
                                        </tr>
                                    ) : (
                                        filteredAdvisories.map((adv, idx) => (
                                            <tr key={adv._id || idx}>
                                                <td>{adv.advisory_type}</td>
                                                <td>{adv.advisory_description}</td>
                                                <td>{formatDate(adv.start_date)} {adv.start_time}</td>
                                                <td>{formatDate(adv.end_date)} {adv.end_time}</td>
                                                <td>Brgy {adv.brgy_number}, {adv.street_name}</td>
                                                <td>
                                                    <span className={`status-badge ${adv.status === 'Ongoing' ? 'status-ongoing' : 'status-upcoming'}`}>
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
            </section>

            {/* ═══ SECTION 2: COMPLAINTS ═══ */}
            <section className="brgy-reports-section">
                <div className="brgy-reports-container">
                    {/* Complaints section header: title left, search right */}
                    <div className="brgy-complaints-section-header">
                        <div className="brgy-complaints-title-group">
                            <h3 className="brgy-complaints-section-title">Complaints</h3>
                            <p className="brgy-complaints-subtitle">View and manage all complaints submitted by your area.</p>
                        </div>
                        <div className="brgy-complaints-header-search">
                            <div className="report-search brgy-search-input">
                                <img src="/img/ic_search.jpg" alt="Search" style={{ filter: 'brightness(0) invert(1)' }} />
                                <input
                                    type="text"
                                    placeholder="Search complaints..."
                                    value={searchComp}
                                    onChange={(e) => setSearchComp(e.target.value)}
                                />
                            </div>
                            <div className="brgy-complaints-tabs">
                                <button
                                    type="button"
                                    className={`brgy-tab ${complaintsTab === 'completed' ? 'brgy-tab-active' : ''}`}
                                    onClick={() => setComplaintsTab('completed')}
                                >
                                    Completed complaints
                                </button>
                                <button
                                    type="button"
                                    className={`brgy-tab ${complaintsTab === 'pending' ? 'brgy-tab-active' : ''}`}
                                    onClick={() => setComplaintsTab('pending')}
                                >
                                    Pending complaints
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Two-column: Complaints Overview (left) | Complaints grid (right) */}
                    <div className="brgy-complaints-two-col">
                        {/* LEFT: Complaints Overview */}
                        <aside className="brgy-summary-sidebar">
                            <div className="brgy-complaints-overview-card">
                                <h4 className="brgy-overview-title">Complaints Overview</h4>
                                <div className="brgy-overview-stats">
                                    <div className="brgy-overview-row pending">
                                        <div className="brgy-overview-label">Pending</div>
                                        <div className="brgy-overview-sublist">
                                            <span>New (within 24 hrs)</span>
                                            <span className="brgy-overview-count">{stats.pendingNew24 ?? 0}</span>
                                        </div>
                                        <div className="brgy-overview-sublist">
                                            <span>Total</span>
                                            <span className="brgy-overview-count">{stats.pending}</span>
                                        </div>
                                    </div>
                                    <div className="brgy-overview-row verified">
                                        <div className="brgy-overview-label">Verified</div>
                                        <span className="brgy-overview-count">{stats.verified}</span>
                                    </div>
                                    <div className="brgy-overview-row resolved">
                                        <div className="brgy-overview-label">Resolved</div>
                                        <span className="brgy-overview-count">{stats.resolved}</span>
                                    </div>
                                    <div className="brgy-overview-row rejected">
                                        <div className="brgy-overview-label">Rejected</div>
                                        <span className="brgy-overview-count">{stats.rejected}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* RIGHT: Complaints Grid */}
                        <div className="brgy-complaints-main">
                            {loading ? (
                                <div className="complaints-loading">
                                    <div className="loader"></div>
                                    <span>Loading complaints...</span>
                                </div>
                            ) : filteredComplaints.length === 0 ? (
                                <div className="complaints-empty">
                                    <p>No complaints match your search.</p>
                                </div>
                            ) : (
                                <div className="complaints-grid">
                                    {filteredComplaints.map(comp => (
                                        <ComplaintCard
                                            key={comp.complaint_id}
                                            complaint={comp}
                                            onAction={handleComplaintAction}
                                            actionLoading={actionLoading}
                                            showActions={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default BrgyAdminDashboard;
