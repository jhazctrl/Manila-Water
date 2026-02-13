/**
 * Account Holder Homepage
 * Shows active advisories and quick links to file complaints / view history
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import advisoryService from '../../services/advisory.service';
import complaintService from '../../services/complaint.service';
import Header from '../Common/Header';
import Footer from '../Common/Footer';

const AccountHolderHome = () => {
    const { user } = useAuth();
    const [advisories, setAdvisories] = useState([]);
    const [myComplaints, setMyComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [advRes, compRes] = await Promise.all([
                    advisoryService.getAdvisories(),
                    complaintService.getMyComplaints(),
                ]);
                if (advRes.success) setAdvisories(advRes.data);
                if (compRes.success) setMyComplaints(compRes.data.slice(0, 5));
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        const classes = {
            pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
            verified: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
            resolved: 'bg-green-500/20 text-green-300 border-green-500/50',
            rejected: 'bg-red-500/20 text-red-300 border-red-500/50',
            ongoing: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
            upcoming: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classes[s] || 'bg-gray-500/20 text-gray-300 border-gray-500/50'}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a2332] font-poppins">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-poppins bg-[#1a2332] text-white flex flex-col">
            <Header showLogout />

            {/* Header with background */}
            <div className="relative pt-24 pb-12 px-4 md:px-8 flex-grow">
                <div className="absolute inset-0 z-0">
                    <img src="/img/bg_homepage.jpg" alt="Background" className="w-full h-full object-cover opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1a2332]/80 to-[#1a2332]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="mb-8 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {user.first_name}!</h1>
                        <p className="text-white/60">Manila Water Sampaloc — Information System</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                        <Link to="/complaints/new" className="group p-6 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl shadow-lg border border-teal-500/30 hover:shadow-teal-500/20 hover:-translate-y-1 transition-all duration-300">
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📝</div>
                            <h3 className="font-bold text-lg mb-1">File a Complaint</h3>
                            <p className="text-white/70 text-sm">Report a water issue in your area</p>
                        </Link>

                        <Link to="/complaints/my" className="group p-6 bg-white/5 hover:bg-white/10 rounded-xl shadow-lg border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📋</div>
                            <h3 className="font-bold text-lg mb-1">My Complaints</h3>
                            <p className="text-white/60 text-sm">Track status of your reports</p>
                        </Link>

                        <Link to="/profile" className="group p-6 bg-white/5 hover:bg-white/10 rounded-xl shadow-lg border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">👤</div>
                            <h3 className="font-bold text-lg mb-1">My Profile</h3>
                            <p className="text-white/60 text-sm">Manage your account details</p>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                        {/* Active Advisories */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="text-yellow-400">🔔</span> Active Advisories
                                </h2>
                            </div>

                            {advisories.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <p className="text-white/40">No active water interruptions in your area.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {advisories.map((adv) => (
                                        <div key={adv.advisory_id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-teal-400">{adv.advisory_type || 'Advisory'}</h3>
                                                {getStatusBadge(adv.status)}
                                            </div>
                                            <p className="text-sm text-white/80 mb-3">{adv.advisory_description}</p>
                                            <div className="text-xs text-white/50 space-y-1">
                                                <p className="flex items-center gap-2">
                                                    <span>📍</span> {adv.street_name}, {adv.brgy_number}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span>📅</span> {adv.start_date} {adv.start_time} — {adv.end_date} {adv.end_time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Complaints */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <span className="text-teal-400">📋</span> Recent Complaints
                                </h2>
                                <Link to="/complaints/my" className="text-sm text-teal-400 hover:text-teal-300 hover:underline">View All</Link>
                            </div>

                            {myComplaints.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                    <p className="text-white/40">You haven't filed any complaints yet.</p>
                                    <Link to="/complaints/new" className="inline-block mt-4 text-teal-400 hover:text-teal-300 text-sm font-semibold">
                                        + File your first complaint
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-white/50 uppercase border-b border-white/10">
                                            <tr>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {myComplaints.map((c) => (
                                                <tr key={c.complaint_id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-white/90">{c.complaint_type}</td>
                                                    <td className="px-4 py-3 text-white/60">{new Date(c.complaint_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {getStatusBadge(c.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AccountHolderHome;
