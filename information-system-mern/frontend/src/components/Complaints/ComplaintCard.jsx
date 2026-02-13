/**
 * ComplaintCard.jsx — Reusable complaint card component
 * Used in BrgyAdminDashboard and potentially other views
 */
import './ComplaintCard.css';

const ComplaintCard = ({ complaint, onAction, actionLoading, showActions = true }) => {
    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            verified: '#10b981',
            resolved: '#3b82f6',
            rejected: '#ef4444',
            ongoing: '#3182ce'
        };
        return colors[(status || '').toLowerCase()] || '#666';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} - ${h12}:${m} ${ampm}`;
        } catch {
            return dateString;
        }
    };

    const isProcessing = actionLoading === complaint.complaint_id;

    return (
        <div className="complaint-card">
            <div className="complaint-header">
                <span
                    className="complaint-status-badge"
                    style={{ background: getStatusColor(complaint.status) }}
                >
                    {complaint.status}
                </span>
                <span className="complaint-id">#{complaint.complaint_id}</span>
            </div>

            {/* Image */}
            <div className="complaint-image">
                {complaint.supporting_img ? (
                    <img
                        src={`/uploads/${complaint.supporting_img}`}
                        alt="Complaint evidence"
                        loading="lazy"
                    />
                ) : (
                    <div className="complaint-image-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>No Image</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="complaint-content">
                <p className="complaint-date">
                    {formatDate(complaint.created_at || complaint.complaint_date)}
                </p>

                <h4 className="complaint-type">
                    {complaint.complaint_type || complaint.water_problem_type || 'Water quality issue'}
                </h4>

                <p className="complaint-description">
                    {complaint.complaint_description || complaint.description || 'No description provided.'}
                </p>

                <div className="complaint-meta">
                    <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{complaint.street_name}{complaint.brgy_number ? `, Brgy ${complaint.brgy_number}` : ''}</span>
                    </div>
                    {(complaint.submitted_by || complaint.citizen_name) && (
                        <div className="meta-item">
                            <span className="meta-icon">👤</span>
                            <span>{complaint.submitted_by || complaint.citizen_name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions - only for pending complaints with showActions enabled */}
            {showActions && (complaint.status || '').toLowerCase() === 'pending' && onAction && (
                <div className="complaint-actions">
                    <button
                        className="btn-verify"
                        onClick={() => onAction(complaint.complaint_id, 'verify')}
                        disabled={isProcessing}
                    >
                        {isProcessing ? '...' : '✓ Verify'}
                    </button>
                    <button
                        className="btn-reject"
                        onClick={() => onAction(complaint.complaint_id, 'reject')}
                        disabled={isProcessing}
                    >
                        ✕ Reject
                    </button>
                </div>
            )}
        </div>
    );
};

export default ComplaintCard;
