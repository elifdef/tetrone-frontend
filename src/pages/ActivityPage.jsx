import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import ActivityService from '../services/activity.service';
import LikedPostsTab from '../components/activity/LikedPostsTab';
import MyCommentsTab from '../components/activity/MyCommentsTab';
import MyRepostsTab from '../components/activity/MyRepostsTab';
import ScreenTimeTab from '../components/activity/ScreenTimeTab';
import VotedPollsTab from '../components/activity/VotedPollsTab';
import Tabs from '../components/ui/Tabs';
import { usePageTitle } from '../hooks/usePageTitle';
import { notifyError } from '../components/common/Notify';

export default function ActivityPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get('tab') || 'likes';

    const [counts, setCounts] = useState({ likes: 0, comments: 0, reposts: 0, voted_polls: 0 });

    const getPageTitle = () => {
        const baseTitle = t('common.my_activity');
        switch (activeTab) {
            case 'likes': return `${baseTitle} | ${t('common.likes')}`;
            case 'comments': return `${baseTitle} | ${t('common.comments')}`;
            case 'reposts': return `${baseTitle} | ${t('common.reposts')}`;
            case 'voted-polls': return `${baseTitle} | ${t('common.poll')}`;
            case 'stats': return `${baseTitle} | ${t('activity.stats.title')}`;
            default: return `${baseTitle} | ${t('common.likes')}`;
        }
    };

    usePageTitle(getPageTitle());

    useEffect(() => {
        ActivityService.getCounts()
        .onSuccess((res) => {
            setCounts(res.counts || { likes: 0, comments: 0, reposts: 0, voted_polls: 0 });
        })
        .onError((err) => {
            notifyError(err.message || t('error.load_failed'));
        });
    }, [t]);

    const updateCount = useCallback((type, delta) => {
        setCounts(prev => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) + delta)
        }));
    }, []);

    const handleTabChange = (newTab) => {
        setSearchParams({ tab: newTab });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'comments':
                return <MyCommentsTab onCountUpdate={(delta) => updateCount('comments', delta)} />;
            case 'reposts':
                return <MyRepostsTab onCountUpdate={(delta) => updateCount('reposts', delta)} />;
            case 'voted-polls':
                return <VotedPollsTab />;
            case 'stats':
                return <ScreenTimeTab />;
            case 'likes':
            default:
                return <LikedPostsTab onCountUpdate={(delta) => updateCount('likes', delta)} />;
        }
    };

    const tabsList = [
        {
            id: 'likes',
            label: (
                    <span className="flex items-center gap-[4px]">
                    {t('common.likes')} <span className="font-normal opacity-80">({counts.likes})</span>
                </span>
                )
        },
        {
            id: 'comments',
            label: (
                    <span className="flex items-center gap-[4px]">
                    {t('common.comments')} <span className="font-normal opacity-80">({counts.comments})</span>
                </span>
                )
        },
        {
            id: 'reposts',
            label: (
                    <span className="flex items-center gap-[4px]">
                    {t('common.reposts')} <span className="font-normal opacity-80">({counts.reposts})</span>
                </span>
                )
        },
        {
            id: 'voted-polls',
            label: (
                    <span className="flex items-center gap-[4px]">
                    {t('common.poll')} <span className="font-normal opacity-80">({counts.voted_polls})</span>
                </span>
                )
        },
        {
            id: 'stats',
            label: t('activity.stats.title')
        }
    ];

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">

            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border flex justify-between items-center max-md:-mt-[10px] max-md:-mx-[10px]">
                <div className="flex items-center gap-[6px]">
                    <span>{t('common.my_activity')}</span>
                </div>
            </div>

            <Tabs
                tabs={tabsList}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <div className="flex flex-col min-w-0">
                {renderContent()}
            </div>

        </div>
    );
}