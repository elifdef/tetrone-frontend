import { useSearchParams } from 'react-router';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import Tabs from '@/components/ui/Tabs';
import ProfileSettings from '@/features/settings/components/ProfileSettings';
import SecuritySettings from '@/features/settings/components/SecuritySettings';
import PersonalizationSettings from '@/features/settings/components/PersonalizationSettings';
import NotificationSettings from '@/features/settings/components/NotificationSettings';
import SessionsSettings from '@/features/settings/components/SessionsSettings';
import PrivacySettings from '@/features/settings/components/PrivacySettings';
import type { SettingsTabId } from '@/features/settings/types/settings';

const SettingsPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('act') as SettingsTabId) || 'profile';

    const getPageTitle = (): string => {
        if (activeTab === 'security') return t('common.security');
        if (activeTab === 'personalization') return t('settings.personalization');
        if (activeTab === 'notifications') return t('common.notifications');
        if (activeTab === 'sessions') return t('settings.sessions');
        if (activeTab === 'privacy') return t('common.privacy');
        return t('settings.profile_settings');
    };

    usePageTitle(getPageTitle());

    const settingsTabs: Array<{ id: SettingsTabId; label: string }> = [
        { id: 'profile', label: t('common.profile') },
        { id: 'personalization', label: t('settings.personalization') },
        { id: 'security', label: t('common.security') },
        { id: 'notifications', label: t('common.notifications') },
        { id: 'sessions', label: t('settings.sessions') },
        { id: 'privacy', label: t('common.privacy') },
    ];

    const handleTabChange = (tabId: string) => {
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