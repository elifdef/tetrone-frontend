import {useContext, useEffect, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate, useSearchParams} from 'react-router';
import {usePageTitle} from "../hooks/usePageTitle";
import {AuthContext} from "../context/AuthContext";
import {userRole} from '../config';
import Dashboard from '../components/admin/Dashboard';
import AdminReports from '../components/admin/AdminReports';
import {PostsManager} from '../components/admin/PostsManager';
import {UsersManager} from '../components/admin/UsersManager';
import Tabs from '../components/ui/Tabs';
import AdminAppeals from '../components/admin/AdminAppeals';
import AdminTickets from '../components/admin/AdminTickets';
import DatabaseManager from '../components/admin/DatabaseManager';
import StaffLogs from '../components/admin/StaffLogs';

const AdminPage = () =>
{
    const {t} = useTranslation();
    const {user: currentUser} = useContext(AuthContext);
    const navigate = useNavigate();

    const isAdmin = currentUser?.role >= userRole.Admin;
    const isCreator = currentUser?.role === userRole.Owner;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    useEffect(() =>
    {
        if (!isAdmin)
        {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    const adminTabs = useMemo(() =>
    {
        const tabs = [
            {id: 'dashboard', label: t('admin.dashboard.title')},
            {id: 'reports', label: t('admin.reports.title')},
            {id: 'appeals', label: t('admin.appeals.title')},
            {id: 'tickets', label: t('admin.support.title')},
            {id: 'posts', label: t('admin.posts.title')},
            {id: 'users', label: t('admin.users.title')},
            {id: 'staff-logs', label: t('admin.staff_logs.title')}
        ];

        if (isCreator)
        {
            tabs.push({id: 'database', label: t('admin.database')});
        }

        return tabs;
    }, [t, isCreator]);

    // ФІКС: Знаходимо назву поточного табу і динамічно встановлюємо Title
    const currentTabTitle = adminTabs.find(tab => tab.id === activeTab)?.label || t('common.admin_panel');
    usePageTitle(`${t('common.admin_panel')} - ${currentTabTitle}`);

    const handleTabChange = (tabId) =>
    {
        setSearchParams({tab: tabId});
    };

    const renderContent = () =>
    {
        switch (activeTab)
        {
            case 'dashboard':
                return <Dashboard/>;
            case 'reports':
                return <AdminReports/>;
            case 'appeals':
                return <AdminAppeals/>;
            case 'tickets':
                return <AdminTickets/>;
            case 'posts':
                return <PostsManager currentUser={currentUser}/>;
            case 'users':
                return <UsersManager canBan={true}/>;
            case 'staff-logs':
                return <StaffLogs/>;
            case 'database':
                return isCreator ? <DatabaseManager/> : null;
            default:
                return null;
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">
            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border flex justify-between items-center max-md:-mt-[10px] max-md:-mx-[10px]">
                <div className="flex items-center gap-[6px]">
                    <span>{t('common.admin_panel')}</span>
                </div>
            </div>

            <Tabs
                tabs={adminTabs}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <div className="w-full">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;