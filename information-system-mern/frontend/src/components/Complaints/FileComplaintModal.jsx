/**
 * FileComplaintModal.jsx — FIXED VERSION
 * Matches backend API expectations
 */
import { useState, useEffect } from 'react';
import locationService from '../../services/location.service';
import complaintService from '../../services/complaint.service';

const FileComplaintModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        contact_no: '',
        address_detail: '',
        brgy_id: '',
        street_id: '',
        complaint_type: '',
        complaint_duration: '',
        complaint_description: '',
    });
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [barangays, setBarangays] = useState([]);
    const [streets, setStreets] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await locationService.getBarangays();
                if (res.success) setBarangays(res.data);
            } catch (err) {
                console.error('Failed to load barangays:', err);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!form.brgy_id) { setStreets([]); return; }
        const load = async () => {
            try {
                const res = await locationService.getStreetsByBarangay(form.brgy_id);
                if (res.success) setStreets(res.data);
            } catch (err) {
                console.error('Failed to load streets:', err);
            }
        };
        load();
    }, [form.brgy_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f && f.size > 5 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, file: 'File must be less than 5MB' }));
            return;
        }
        setFile(f);
        if (errors.file) setErrors((prev) => ({ ...prev, file: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.contact_no.trim()) newErrors.contact_no = 'Contact number is required';
        else if (!/^(09|\+639)\d{9}$/.test(form.contact_no.replace(/\s|-/g, ''))) {
            newErrors.contact_no = 'Invalid phone format (e.g. 09123456789)';
        }
        if (!form.address_detail.trim()) newErrors.address_detail = 'Address is required';
        if (!form.brgy_id) newErrors.brgy_id = 'Barangay is required';
        if (!form.street_id) newErrors.street_id = 'Street is required';
        if (!form.complaint_type) newErrors.complaint_type = 'Problem type is required';
        if (!form.complaint_duration) newErrors.complaint_duration = 'Duration is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setSubmitError('');
        
        try {
            const formData = new FormData();
            
            // ✅ FIXED: Use correct field names that match backend
            formData.append('contact_no', form.contact_no.trim());
            formData.append('address_detail', form.address_detail.trim());
            formData.append('brgy_id', form.brgy_id);
            formData.append('street_id', form.street_id);
            formData.append('complaint_type', form.complaint_type);
            formData.append('complaint_duration', form.complaint_duration);
            formData.append('complaint_description', form.complaint_description.trim());
            
            // ✅ FIXED: Use 'supporting_img' (not 'attachment')
            if (file) formData.append('supporting_img', file);

            const response = await complaintService.submitComplaint(formData);
            console.log('✅ Complaint submitted successfully:', response);
            onSuccess();
        } catch (err) {
            console.error('❌ Complaint submission error:', err);
            setSubmitError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200 outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary/30 transition-all";
    const selectClass = "w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200 outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary/30 transition-all appearance-none cursor-pointer";

    const problemTypes = [
        { id: 1, label: 'No Water Supply' },
        { id: 2, label: 'Low Water Pressure' },
        { id: 3, label: 'Discolored Water' },
        { id: 4, label: 'Water Leakage' },
        { id: 5, label: 'Others' },
    ];

    const durations = [
        { id: 1, label: 'Less than 1 hour' },
        { id: 2, label: '1-3 hours' },
        { id: 3, label: '3-6 hours' },
        { id: 4, label: '6-12 hours' },
        { id: 5, label: 'More than 12 hours' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-poppins">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">File a Complaint</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {submitError && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
                            {submitError}
                        </div>
                    )}

                    {/* Contact Number */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Number *</label>
                        <input 
                            type="tel" 
                            name="contact_no" 
                            placeholder="09XX-XXX-XXXX" 
                            value={form.contact_no} 
                            onChange={handleChange} 
                            disabled={isSubmitting} 
                            className={inputClass} 
                        />
                        {errors.contact_no && <p className="text-red-500 text-xs mt-1">{errors.contact_no}</p>}
                    </div>

                    {/* Address Detail */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Address Detail *</label>
                        <input 
                            type="text" 
                            name="address_detail" 
                            placeholder="Unit/House No., Floor, Subdivision" 
                            value={form.address_detail} 
                            onChange={handleChange} 
                            disabled={isSubmitting} 
                            className={inputClass} 
                        />
                        {errors.address_detail && <p className="text-red-500 text-xs mt-1">{errors.address_detail}</p>}
                    </div>

                    {/* Barangay + Street */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Barangay *</label>
                            <select 
                                name="brgy_id" 
                                value={form.brgy_id} 
                                onChange={handleChange} 
                                disabled={isSubmitting} 
                                className={selectClass}
                            >
                                <option value="">Select Barangay</option>
                                {barangays.map((b) => (
                                    <option key={b.brgy_id} value={b.brgy_id}>
                                        {b.brgy_number || b.brgy_name || `BRGY-${b.brgy_id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.brgy_id && <p className="text-red-500 text-xs mt-1">{errors.brgy_id}</p>}
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Street *</label>
                            <select 
                                name="street_id" 
                                value={form.street_id} 
                                onChange={handleChange} 
                                disabled={isSubmitting || !form.brgy_id} 
                                className={selectClass}
                            >
                                <option value="">Select Street</option>
                                {streets.map((s) => (
                                    <option key={s.street_id} value={s.street_id}>
                                        {s.street_name || `Street ${s.street_id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.street_id && <p className="text-red-500 text-xs mt-1">{errors.street_id}</p>}
                        </div>
                    </div>

                    {/* Complaint Type */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Complaint Type *</label>
                        <select 
                            name="complaint_type" 
                            value={form.complaint_type} 
                            onChange={handleChange} 
                            disabled={isSubmitting} 
                            className={selectClass}
                        >
                            <option value="">Select Problem Type</option>
                            {problemTypes.map((t) => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        {errors.complaint_type && <p className="text-red-500 text-xs mt-1">{errors.complaint_type}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Duration *</label>
                        <select 
                            name="complaint_duration" 
                            value={form.complaint_duration} 
                            onChange={handleChange} 
                            disabled={isSubmitting} 
                            className={selectClass}
                        >
                            <option value="">Select Duration</option>
                            {durations.map((d) => (
                                <option key={d.id} value={d.id}>{d.label}</option>
                            ))}
                        </select>
                        {errors.complaint_duration && <p className="text-red-500 text-xs mt-1">{errors.complaint_duration}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Additional Details (optional)</label>
                        <textarea 
                            name="complaint_description" 
                            placeholder="Describe the issue..." 
                            value={form.complaint_description} 
                            onChange={handleChange} 
                            disabled={isSubmitting} 
                            rows={3} 
                            className={inputClass + " resize-none"} 
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Supporting Image (optional, max 5MB)</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-primary hover:file:bg-teal-100 cursor-pointer"
                        />
                        {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
                        {file && <p className="text-gray-500 text-xs mt-1">Selected: {file.name}</p>}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-full border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 rounded-full bg-teal-primary hover:bg-teal-dark text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileComplaintModal;
