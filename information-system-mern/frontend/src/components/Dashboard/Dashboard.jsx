/**
 * Dashboard Router — renders role-specific dashboard
 */
import { useAuth } from '../../context/AuthContext';
import BrgyAdminDashboard from './BrgyAdminDashboard';
import CentralAdminDashboard from './CentralAdminDashboard';
import AccountHolderHome from './AccountHolderHome';


const Dashboard = () => {
    const { user } = useAuth();

    if (!user) return null;

    switch (user.role_id) {
        case 1:
            return <AccountHolderHome />;
        case 2:
            return <BrgyAdminDashboard />;
        case 3:
            return <CentralAdminDashboard />;
        default:
            return <div className="dashboard-error">Unknown role. Contact administrator.</div>;
    }
};

export default Dashboard;
