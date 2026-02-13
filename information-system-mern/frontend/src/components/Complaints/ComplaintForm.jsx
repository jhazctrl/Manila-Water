/**
 * Complaint Form Component
 * Allows Account Holders to file complaints with image upload
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import locationService from '../../services/location.service';
import complaintService from '../../services/complaint.service';
import { isValidPhone } from '../../utils/validators';
import { sanitizeInput } from '../../utils/sanitizer';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

const COMPLAINT_TYPES = [
    { id: 1, label: 'No Water Supply' },
    { id: 2, label: 'Low Water Pressure' },
    { id: 3, label: 'Discolored Water' },
    { id: 4, label: 'Water Leakage' },
    { id: 5, label: 'Others' },
];

const COMPLAINT_DURATIONS = [
    { id: 1, label: 'Less than 1 hour' },
    { id: 2, label: '1-3 hours' },
    { id: 3, label: '3-6 hours' },
    { id: 4, label: '6-12 hours' },
    { id: 5, label: 'More than 12 hours' },
];

const ComplaintForm = () => {
    const [form, setForm] = useState({
        contact_no: '', address_detail: '', brgy_id: '', street_id: '',
        complaint_type: '', complaint_duration: '', complaint_description: '',
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [barangays, setBarangays] = useState([]);
    const [streets, setStreets] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        locationService.getBarangays().then((r) => r.success && setBarangays(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!form.brgy_id) { setStreets([]); return; }
        locationService.getStreetsByBarangay(form.brgy_id).then((r) => r.success && setStreets(r.data)).catch(console.error);
    }, [form.brgy_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }));
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                setErrors((prev) => ({ ...prev, image: 'Only JPEG, PNG, GIF, WebP allowed' }));
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, image: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!form.contact_no) newErrors.contact_no = 'Contact number is required';
        else if (!isValidPhone(form.contact_no)) newErrors.contact_no = 'Invalid phone number';
        if (!form.address_detail.trim()) newErrors.address_detail = 'Address is required';
        if (!form.brgy_id) newErrors.brgy_id = 'Select barangay';
        if (!form.street_id) newErrors.street_id = 'Select street';
        if (!form.complaint_type) newErrors.complaint_type = 'Select type';
        if (!form.complaint_duration) newErrors.complaint_duration = 'Select duration';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                formData.append(key, sanitizeInput(String(val)));
            });
            if (image) formData.append('supporting_img', image);

            const res = await complaintService.submitComplaint(formData);
            if (res.success) {
                setSuccess(res.data.complaint_id);
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Failed to submit complaint' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all text-sm";
    const selectClass = "w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all text-sm appearance-none cursor-pointer";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";

    if (success) {
        return (
            <div className="min-h-screen font-poppins bg-[#1a2332] text-white flex flex-col">
                <Header showLogout showBack backTo="/dashboard" />
                <div className="flex-grow flex items-center justify-center px-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-10 border border-white/10 shadow-2xl text-center max-w-md w-full">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold mb-2">Complaint Submitted!</h2>
                        <p className="text-white/70">Your complaint ID: <strong className="text-teal-400">{success}</strong></p>
                        <p className="text-white/50 text-sm mt-2">Redirecting to dashboard...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-poppins bg-[#1a2332] text-white flex flex-col">
            <Header showLogout showBack backTo="/dashboard" />

            <div className="relative pt-28 pb-12 px-4 md:px-8 flex-grow">
                <div className="absolute inset-0 z-0">
                    <img src="/img/bg_homepage.jpg" alt="Background" className="w-full h-full object-cover opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a2332]/90 to-[#1a2332]" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-10 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                            <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-2xl shadow-lg">📝</div>
                            <div>
                                <h1 className="text-2xl font-bold">File a Complaint</h1>
                                <p className="text-white/60 text-sm">Report a water issue in your area</p>
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-2">
                                <span>⚠</span> {errors.submit}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="complaint_type" className={labelClass}>Complaint Type *</label>
                                    <select id="complaint_type" name="complaint_type" value={form.complaint_type} onChange={handleChange} className={selectClass}>
                                        <option value="">Select type</option>
                                        {COMPLAINT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                    {errors.complaint_type && <span className="text-red-400 text-xs mt-1 block">{errors.complaint_type}</span>}
                                </div>
                                <div>
                                    <label htmlFor="complaint_duration" className={labelClass}>Duration *</label>
                                    <select id="complaint_duration" name="complaint_duration" value={form.complaint_duration} onChange={handleChange} className={selectClass}>
                                        <option value="">Select duration</option>
                                        {COMPLAINT_DURATIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                                    </select>
                                    {errors.complaint_duration && <span className="text-red-400 text-xs mt-1 block">{errors.complaint_duration}</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="contact_no" className={labelClass}>Contact Number *</label>
                                <input id="contact_no" name="contact_no" type="text" value={form.contact_no}
                                    onChange={handleChange} placeholder="09XX-XXX-XXXX" className={inputClass} />
                                {errors.contact_no && <span className="text-red-400 text-xs mt-1 block">{errors.contact_no}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="brgy_id" className={labelClass}>Barangay *</label>
                                    <select id="brgy_id" name="brgy_id" value={form.brgy_id} onChange={handleChange} className={selectClass}>
                                        <option value="">Select barangay</option>
                                        {barangays.map((b) => <option key={b.brgy_id} value={b.brgy_id}>{b.brgy_number}</option>)}
                                    </select>
                                    {errors.brgy_id && <span className="text-red-400 text-xs mt-1 block">{errors.brgy_id}</span>}
                                </div>
                                <div>
                                    <label htmlFor="street_id" className={labelClass}>Street *</label>
                                    <select id="street_id" name="street_id" value={form.street_id} onChange={handleChange} disabled={!form.brgy_id} className={selectClass}>
                                        <option value="">Select street</option>
                                        {streets.map((s) => <option key={s.street_id} value={s.street_id}>{s.street_name}</option>)}
                                    </select>
                                    {errors.street_id && <span className="text-red-400 text-xs mt-1 block">{errors.street_id}</span>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address_detail" className={labelClass}>Address Detail *</label>
                                <input id="address_detail" name="address_detail" type="text" value={form.address_detail}
                                    onChange={handleChange} placeholder="House no., building, landmark" maxLength={255} className={inputClass} />
                                {errors.address_detail && <span className="text-red-400 text-xs mt-1 block">{errors.address_detail}</span>}
                            </div>

                            <div>
                                <label htmlFor="complaint_description" className={labelClass}>Description (Optional)</label>
                                <textarea id="complaint_description" name="complaint_description" value={form.complaint_description}
                                    onChange={handleChange} placeholder="Additional details about the issue..." rows={3} maxLength={1000} className={inputClass + " resize-none"} />
                            </div>

                            <div>
                                <label htmlFor="supporting_img" className={labelClass}>Supporting Image (Optional, max 5MB)</label>
                                <input id="supporting_img" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageChange}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 cursor-pointer" />
                                {errors.image && <span className="text-red-400 text-xs mt-1 block">{errors.image}</span>}
                                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 max-w-[200px] max-h-[200px] rounded-lg border-2 border-white/10" />}
                            </div>

                            <button type="submit" disabled={isSubmitting}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ComplaintForm;
