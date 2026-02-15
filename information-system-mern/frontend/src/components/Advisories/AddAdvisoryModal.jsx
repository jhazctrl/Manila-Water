import { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../css/central_adm_dashboard.css';

const AddAdvisoryModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        advisory_type_id: '',
        advisory_description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        street_id: '',
        brgy_id: '',
        status: 'upcoming'
    });

    const [loading, setLoading] = useState(false);
    const [barangays, setBarangays] = useState([]);
    const [streets, setStreets] = useState([]);

    useEffect(() => {
        fetchBarangays();
    }, []);

    useEffect(() => {
        if (formData.brgy_id) {
            fetchStreets(formData.brgy_id);
        } else {
            setStreets([]);
            setFormData(prev => ({ ...prev, street_id: '' }));
        }
    }, [formData.brgy_id]);

    const fetchBarangays = async () => {
        try {
            const res = await api.get('/locations/barangays');
            if (res.data.success) {
                setBarangays(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching barangays:', error);
        }
    };

    const fetchStreets = async (brgyId) => {
        try {
            const res = await api.get(`/locations/barangays/${brgyId}/streets`);
            if (res.data.success) {
                setStreets(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching streets:', error);
            setStreets([]);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Convert numeric fields to integers
        if (name === 'advisory_type_id' || name === 'brgy_id' || name === 'street_id') {
            setFormData({ ...formData, [name]: value ? parseInt(value, 10) : '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Validate dates
            const startDT = new Date(`${formData.start_date}T${formData.start_time}`);
            const endDT = new Date(`${formData.end_date}T${formData.end_time}`);
            
            if (endDT <= startDT) {
                alert('End date/time must be after start date/time');
                setLoading(false);
                return;
            }

            // Ensure all required fields are present
            const payload = {
                advisory_type_id: parseInt(formData.advisory_type_id, 10),
                advisory_description: formData.advisory_description.trim(),
                start_date: formData.start_date,
                start_time: formData.start_time,
                end_date: formData.end_date,
                end_time: formData.end_time,
                brgy_id: parseInt(formData.brgy_id, 10),
                street_id: parseInt(formData.street_id, 10),
                status: formData.status
            };

            console.log('Submitting advisory:', payload);

            const res = await api.post('/advisories', payload);
            
            if (res.data.success) {
                alert('Advisory added successfully!');
                onSuccess();
                onClose();
            } else {
                alert(res.data.message || 'Failed to add advisory');
            }
        } catch (error) {
            console.error('Error adding advisory:', error);
            const errorMsg = error.response?.data?.message || 
                            error.response?.data?.errors?.map(e => e.message).join(', ') ||
                            'Failed to add advisory';
            alert(errorMsg);
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
                                <label className="complaint-info-label">Advisory Type *</label>
                                <select
                                    name="advisory_type_id"
                                    value={formData.advisory_type_id}
                                    onChange={handleChange}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                >
                                    <option value="">Select type</option>
                                    <option value="1">Water Interruption</option>
                                    <option value="2">Scheduled Maintenance</option>
                                    <option value="3">Emergency Repair</option>
                                    <option value="4">Water Quality Advisory</option>
                                </select>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Description *</label>
                                <textarea
                                    name="advisory_description"
                                    value={formData.advisory_description}
                                    onChange={handleChange}
                                    rows="3"
                                    maxLength="2000"
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                    placeholder="e.g. Emergency leak repair..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">Start Date *</label>
                                    <input
                                        type="date" 
                                        name="start_date"
                                        value={formData.start_date} 
                                        onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">Start Time *</label>
                                    <input
                                        type="time" 
                                        name="start_time"
                                        value={formData.start_time} 
                                        onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">End Date *</label>
                                    <input
                                        type="date" 
                                        name="end_date"
                                        value={formData.end_date} 
                                        onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                                <div className="complaint-info-item">
                                    <label className="complaint-info-label">End Time *</label>
                                    <input
                                        type="time" 
                                        name="end_time"
                                        value={formData.end_time} 
                                        onChange={handleChange}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Affected Barangay *</label>
                                <select
                                    name="brgy_id"
                                    value={formData.brgy_id}
                                    onChange={handleChange}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                >
                                    <option value="">Select barangay</option>
                                    {barangays.map((brgy) => (
                                        <option key={brgy.brgy_id} value={brgy.brgy_id}>
                                            Barangay {brgy.brgy_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Affected Street *</label>
                                <select
                                    name="street_id"
                                    value={formData.street_id}
                                    onChange={handleChange}
                                    disabled={!formData.brgy_id}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                >
                                    <option value="">
                                        {!formData.brgy_id ? 'Select barangay first' : 'Select street'}
                                    </option>
                                    {streets.map((street) => (
                                        <option key={street.street_id} value={street.street_id}>
                                            {street.street_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="complaint-info-item">
                                <label className="complaint-info-label">Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontFamily: 'Poppins' }}
                                    required
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                </select>
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
