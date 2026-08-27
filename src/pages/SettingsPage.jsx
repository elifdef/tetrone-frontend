import { useContext } from 'react';
import { useSearchParams } from 'react-router';
import { AuthContext } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import Tabs from '../components/ui/Tabs';
import ProfileSettings from '../components/settings/ProfileSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import PersonalizationSettings from '../components/settings/PersonalizationSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SessionsSettings from '../components/settings/SessionsSettings';
import PrivacySettings from '../components/settings/PrivacySettings';

const SettingsPage = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('act') || 'profile';

    const getPageTitle = () => {
        if (activeTab === 'security') return t('common.security');
        if (activeTab === 'personalization') return t('settings.personalization');
        if (activeTab === 'notifications') return t('common.notifications');
        if (activeTab === 'sessions') return t('settings.sessions');
        if (activeTab === 'privacy') return t('common.privacy');
        return t('settings.profile_settings');
    };

    usePageTitle(getPageTitle());

    const settingsTabs = [
        { id: 'profile', label: t('common.profile') },
        { id: 'personalization', label: t('settings.personalization') },
        { id: 'security', label: t('common.security') },
        { id: 'notifications', label: t('common.notifications') },
        { id: 'sessions', label: t('settings.sessions') },
        { id: 'privacy', label: t('common.privacy') }
    ];

    const handleTabChange = (tabId) => {
        setSearchParams({ act: tabId });
    };

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border font-tahoma text-[11px] text-text-main max-md:p-[10px]">

            <h1 className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                {t('common.settings')}
            </h1>

            <Tabs
                tabs={settingsTabs}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <div className="flex flex-col w-full">
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'personalization' && <PersonalizationSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'notifications' && <NotificationSettings />}
                {activeTab === 'sessions' && <SessionsSettings />}
                {activeTab === 'privacy' && <PrivacySettings />}
            </div>

        </div>
    );
};

export default SettingsPage;