import { useEffect, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from "../hooks/usePageTitle";
import { AuthContext } from "../context/AuthContext";
import { userRole } from '../config';
import { AdminTabs } from '../components/admin/AdminTabs';
import { PostsManager } from '../components/admin/PostsManager';
import { UsersManager } from '../components/admin/UsersManager';
import AdminReports from '../components/admin/AdminReports';
import AdminTickets from '../components/admin/AdminTickets';

const ModerationPage = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const isModerator = currentUser?.role === userRole.Moderator;
    const activeTab = searchParams.get('tab') || 'reports';

    usePageTitle(t('common.moderator_panel'));

    useEffect(() => {
        if (!isModerator) navigate('/');
    }, [isModerator, navigate]);

    const tabs = useMemo(() => [
        { id: 'reports', label: t('admin.reports.tab') },
        { id: 'tickets', label: t('admin.support.support_tickets') },
        { id: 'posts', label: t('common.posts') },
        { id: 'users', label: t('admin.users_management') }
    ], [t]);

    const handleTabChange = (tabId) => { 
        setSearchParams({ tab: tabId }); 
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'reports': return <AdminReports />;
            case 'tickets': return <AdminTickets />;
            case 'posts': return <PostsManager currentUser={currentUser} />;
            case 'users': return <UsersManager canBan={true} />;
            default: return null;
        }
    };

    if (!isModerator) return null;

    return (
        <div className="tetrone-card-wrapper">
            <h2 className="tetrone-section-title">{t('common.moderator_panel')}</h2>
            
            <AdminTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
            />

            <div className="admin-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default ModerationPage;