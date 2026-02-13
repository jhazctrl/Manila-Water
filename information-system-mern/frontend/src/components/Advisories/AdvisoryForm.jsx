/**
 * Advisory Form Component
 * Admin-only form for creating water advisories
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import locationService from '../../services/location.service';
import advisoryService from '../../services/advisory.service';
import { sanitizeInput } from '../../utils/sanitizer';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

const ADVISORY_TYPES = [
    { id: 1, label: 'Water Interruption' },
    { id: 2, label: 'Scheduled Maintenance' },
    { id: 3, label: 'Emergency Repair' },
    { id: 4, label: 'Water Quality Advisory' },
];

const AdvisoryForm = () => {
    const [form, setForm] = useState({
        advisory_type_id: '', advisory_description: '',
        start_date: '', start_time: '', end_date: '', end_time: '',
        brgy_id: '', street_id: '', status: 'upcoming',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
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

    const validate = () => {
        const newErrors = {};
        if (!form.advisory_type_id) newErrors.advisory_type_id = 'Select advisory type';
        if (!form.advisory_description.trim()) newErrors.advisory_description = 'Description is required';
        if (!form.start_date) newErrors.start_date = 'Start date is required';
        if (!form.start_time) newErrors.start_time = 'Start time is required';
        if (!form.end_date) newErrors.end_date = 'End date is required';
        if (!form.end_time) newErrors.end_time = 'End time is required';
        if (!form.brgy_id) newErrors.brgy_id = 'Select barangay';
        if (!form.street_id) newErrors.street_id = 'Select street';

        // Date validation
        if (form.start_date && form.end_date && form.start_time && form.end_time) {
            const start = new Date(`${form.start_date}T${form.start_time}`);
            const end = new Date(`${form.end_date}T${form.end_time}`);
            if (end <= start) newErrors.end_date = 'End must be after start';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const data = { ...form, advisory_description: sanitizeInput(form.advisory_description) };
            const res = await advisoryService.createAdvisory(data);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || 'Failed to create advisory' });
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
                        <h2 className="text-2xl font-bold mb-2">Advisory Created!</h2>
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
                            <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-2xl shadow-lg">📢</div>
                            <div>
                                <h1 className="text-2xl font-bold">Create Advisory</h1>
                                <p className="text-white/60 text-sm">Publish a water advisory for residents</p>
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
                                    <label htmlFor="advisory_type_id" className={labelClass}>Advisory Type *</label>
                                    <select id="advisory_type_id" name="advisory_type_id" value={form.advisory_type_id} onChange={handleChange} className={selectClass}>
                                        <option value="">Select type</option>
                                        {ADVISORY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                    {errors.advisory_type_id && <span className="text-red-400 text-xs mt-1 block">{errors.advisory_type_id}</span>}
                                </div>
                                <div>
                                    <label htmlFor="status" className={labelClass}>Status *</label>
                                    <select id="status" name="status" value={form.status} onChange={handleChange} className={selectClass}>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="advisory_description" className={labelClass}>Description *</label>
                                <textarea id="advisory_description" name="advisory_description" value={form.advisory_description}
                                    onChange={handleChange} rows={3} maxLength={2000} placeholder="Describe the advisory..." className={inputClass + " resize-none"} />
                                {errors.advisory_description && <span className="text-red-400 text-xs mt-1 block">{errors.advisory_description}</span>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="start_date" className={labelClass}>Start Date *</label>
                                    <input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} className={inputClass} />
                                    {errors.start_date && <span className="text-red-400 text-xs mt-1 block">{errors.start_date}</span>}
                                </div>
                                <div>
                                    <label htmlFor="start_time" className={labelClass}>Start Time *</label>
                                    <input id="start_time" name="start_time" type="time" value={form.start_time} onChange={handleChange} className={inputClass} />
                                    {errors.start_time && <span className="text-red-400 text-xs mt-1 block">{errors.start_time}</span>}
                                </div>
                                <div>
                                    <label htmlFor="end_date" className={labelClass}>End Date *</label>
                                    <input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} className={inputClass} />
                                    {errors.end_date && <span className="text-red-400 text-xs mt-1 block">{errors.end_date}</span>}
                                </div>
                                <div>
                                    <label htmlFor="end_time" className={labelClass}>End Time *</label>
                                    <input id="end_time" name="end_time" type="time" value={form.end_time} onChange={handleChange} className={inputClass} />
                                    {errors.end_time && <span className="text-red-400 text-xs mt-1 block">{errors.end_time}</span>}
                                </div>
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

                            <button type="submit" disabled={isSubmitting}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-teal-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isSubmitting ? 'Creating...' : 'Create Advisory'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AdvisoryForm;
