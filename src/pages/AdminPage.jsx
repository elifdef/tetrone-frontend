import { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import { userRole } from '../config';
import Dashboard from '../components/admin/Dashboard';
import AdminReports from '../components/admin/AdminReports';
import { PostsManager } from '../components/admin/PostsManager';
import { UsersManager } from '../components/admin/UsersManager';
import { AdminTabs } from '../components/admin/AdminTabs';
import AdminAppeals from '../components/admin/AdminAppeals';
import AdminTickets from '../components/admin/AdminTickets';
import DatabaseManager from '../components/admin/DatabaseManager';
import StaffLogs from '../components/admin/StaffLogs';

const AdminPage = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    usePageTitle(t('common.admin_panel'));

    const isAdmin = currentUser?.role >= userRole.Admin;
    const isCreator = currentUser?.role === userRole.Creator;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    const adminTabs = useMemo(() => {
        const tabs = [
            { id: 'dashboard', label: t('admin.dashboard.title') },
            { id: 'reports', label: t('admin.reports.tab') },
            { id: 'appeals', label: t('admin.appeals.tab') },
            { id: 'tickets', label: t('admin.support.support_tickets') },
            { id: 'posts', label: t('common.posts') },
            { id: 'users', label: t('admin.users_management') },
            { id: 'staff-logs', label: t('admin.staff_logs') }
        ];

        if (isCreator) {
            tabs.push({ id: 'database', label: t('admin.database') });
        }

        return tabs;
    }, [t, isCreator]);

    const handleTabChange = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'reports': return <AdminReports />;
            case 'appeals': return <AdminAppeals />;
            case 'tickets': return <AdminTickets />;
            case 'posts': return <PostsManager currentUser={currentUser} />;
            case 'users': return <UsersManager canBan={true} />;
            case 'staff-logs': return <StaffLogs />;
            case 'database': return isCreator ? <DatabaseManager /> : null;
            default: return null;
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="tetrone-card-wrapper">
            <h2 className="tetrone-section-title">{t('common.admin_panel')}</h2>

            <AdminTabs
                tabs={adminTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <div className="admin-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;