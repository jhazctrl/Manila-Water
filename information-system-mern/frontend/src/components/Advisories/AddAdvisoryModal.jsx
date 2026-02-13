import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../css/central_adm_dashboard.css'; // Ensure CSS is available

const AddAdvisoryModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        advisory_type: 'Water Interruption',
        advisory_description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        street_name: '',
        brgy_number: ''
    });

    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            // Fetch unique streets/brgys if endpoint exists, else hardcode or free text
            // For now, we'll allow free text entry but ideally this would be a dropdown
            // api.get('/locations')...
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/advisories', formData);
            if (res.data.success) {
                alert('Advisory added successfully!');
                onSuccess();
            } else {
                alert(res.data.message || 'Failed to add advisory');
            }
        } catch (error) {
            console.error('Error adding advisory:', error);
            alert(error.response?.data?.message || 'Failed to add advisory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="complaint-modal-overlay" style={{ display: 'flex' }}>
            <div className="complaint-modal" style={{ maxWidth: '500px' }}>
                {/* Header */}
                <div className="complaint-modal-header">
                    <h2>Add New Advisory</h2>
                    <button className="complaint-modal-close" onClick={onClose}>&times;</button>
                </div>

                {/* Body */}
                <div className="complaint-modal-body">
                    <form id="advisoryForm" onSubmit={handleSubmit}>
                        <div className="complaint-info-grid">

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Advisory Type</label>
                                <select
                                    name="advisory_type"
                                    value={formData.advisory_type}
                                    onChange={handleChange}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                >
                                    <option value="Water Interruption">Water Interruption</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Low Pressure">Low Pressure</option>
                                    <option value="Water Quality">Water Quality</option>
                                </select>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Description</label>
                                <textarea
                                    name="advisory_description"
                                    value={formData.advisory_description}
                                    onChange={handleChange}
                                    rows="3"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                    placeholder="e.g. Emergency leak repair..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">Start Date</label>
                                    <input
                                        type="date" name="start_date"
                                        value={formData.start_date} onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">Start Time</label>
                                    <input
                                        type="time" name="start_time"
                                        value={formData.start_time} onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">End Date</label>
                                    <input
                                        type="date" name="end_date"
                                        value={formData.end_date} onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">End Time</label>
                                    <input
                                        type="time" name="end_time"
                                        value={formData.end_time} onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Affected Barangay</label>
                                <input
                                    type="text" name="brgy_number"
                                    value={formData.brgy_number} onChange={handleChange}
                                    placeholder="e.g. 405"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                />
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Affected Street (Optional)</label>
                                <input
                                    type="text" name="street_name"
                                    value={formData.street_name} onChange={handleChange}
                                    placeholder="e.g. Sampaloc St."
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                />
                            </div>

                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="complaint-modal-footer">
                    <button className="complaint-action-btn secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="complaint-action-btn primary"
                        type="submit"
                        form="advisoryForm"
                        disabled={loading}
                    >
                        {loading ? 'Posting...' : 'Post Advisory'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddAdvisoryModal;
