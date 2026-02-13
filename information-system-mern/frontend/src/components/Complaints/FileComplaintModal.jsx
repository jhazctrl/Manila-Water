/**
 * FileComplaintModal.jsx — Matches file-complaint-modal wireframe
 * Full overlay, white card, phone/address/problem/file inputs
 */
import { useState, useEffect } from 'react';
import locationService from '../../services/location.service';
import complaintService from '../../services/complaint.service';

const FileComplaintModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        phone: '',
        address: '',
        barangayId: '',
        streetId: '',
        waterProblemType: '',
        duration: '',
        description: '',
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
        if (!form.barangayId) { setStreets([]); return; }
        const load = async () => {
            try {
                const res = await locationService.getStreetsByBarangay(form.barangayId);
                if (res.success) setStreets(res.data);
            } catch (err) {
                console.error('Failed to load streets:', err);
            }
        };
        load();
    }, [form.barangayId]);

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
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^(\+63|0)\d{10}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid phone format (e.g. +639123456789)';
        if (!form.address.trim()) newErrors.address = 'Address is required';
        if (!form.barangayId) newErrors.barangayId = 'Barangay is required';
        if (!form.streetId) newErrors.streetId = 'Street is required';
        if (!form.waterProblemType) newErrors.waterProblemType = 'Problem type is required';
        if (!form.duration) newErrors.duration = 'Duration is required';
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
            formData.append('phone', form.phone.trim());
            formData.append('address', form.address.trim());
            formData.append('brgy_id', form.barangayId);
            formData.append('street_id', form.streetId);
            formData.append('water_problem_type', form.waterProblemType);
            formData.append('duration', form.duration);
            formData.append('description', form.description.trim());
            if (file) formData.append('attachment', file);

            await complaintService.submitComplaint(formData);
            onSuccess();
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200 outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary/30 transition-all";
    const selectClass = "w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 text-sm border border-gray-200 outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary/30 transition-all appearance-none cursor-pointer";

    const problemTypes = [
        'No Water Supply',
        'Low Water Pressure',
        'Dirty/Cloudy Water',
        'Leaking Pipe',
        'Water Meter Issue',
        'Billing Concern',
        'Sewerage Issue',
        'Others',
    ];

    const durations = [
        'Less than 1 hour',
        '1 - 3 hours',
        '3 - 6 hours',
        '6 - 12 hours',
        '12 - 24 hours',
        'More than 24 hours',
        'More than 3 days',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-poppins">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Water Problem Report</h2>
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

                    {/* Phone */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number</label>
                        <input type="tel" name="phone" placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={handleChange} disabled={isSubmitting} className={inputClass} />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit/House No., Floor, Subdivision</label>
                        <input type="text" name="address" placeholder="Unit/House No." value={form.address} onChange={handleChange} disabled={isSubmitting} className={inputClass} />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>

                    {/* Barangay + Street (side by side) */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Barangay</label>
                            <select name="barangayId" value={form.barangayId} onChange={handleChange} disabled={isSubmitting} className={selectClass}>
                                <option value="">Select Barangay</option>
                                {barangays.map((b) => (
                                    <option key={b.brgy_id} value={b.brgy_id}>
                                        {b.brgy_number || b.brgy_name || `BRGY-${b.brgy_id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.barangayId && <p className="text-red-500 text-xs mt-1">{errors.barangayId}</p>}
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Street</label>
                            <select name="streetId" value={form.streetId} onChange={handleChange} disabled={isSubmitting || !form.barangayId} className={selectClass}>
                                <option value="">Select Street</option>
                                {streets.map((s) => (
                                    <option key={s.street_id} value={s.street_id}>
                                        {s.street_name || `Street ${s.street_id}`}
                                    </option>
                                ))}
                            </select>
                            {errors.streetId && <p className="text-red-500 text-xs mt-1">{errors.streetId}</p>}
                        </div>
                    </div>

                    {/* Water Problem Type */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Water Problem Type</label>
                        <select name="waterProblemType" value={form.waterProblemType} onChange={handleChange} disabled={isSubmitting} className={selectClass}>
                            <option value="">Select Problem Type</option>
                            {problemTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        {errors.waterProblemType && <p className="text-red-500 text-xs mt-1">{errors.waterProblemType}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Duration of Problem</label>
                        <select name="duration" value={form.duration} onChange={handleChange} disabled={isSubmitting} className={selectClass}>
                            <option value="">Select Duration</option>
                            {durations.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Additional Details (optional)</label>
                        <textarea name="description" placeholder="Describe the issue..." value={form.description} onChange={handleChange} disabled={isSubmitting} rows={3} className={inputClass + " resize-none"} />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Attach Photo (optional, max 5MB)</label>
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
