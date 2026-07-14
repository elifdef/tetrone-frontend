import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SpaceMembersTab = ({ space, isAdmin }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="space-block">
            <div className="space-block-header">
                <span>{t('spaces.blocks_members')}</span>
            </div>

            <div className="space-tabs">
                <button
                    className={activeTab === 'all' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('all')}
                >
                    {t('spaces.members_all')}
                </button>
                <button
                    className={activeTab === 'staff' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('staff')}
                >
                    {t('spaces.members_staff')}
                </button>
                {isAdmin && (
                    <button
                        className={activeTab === 'banned' ? 'tab-btn active' : 'tab-btn'}
                        onClick={() => setActiveTab('banned')}
                    >
                        {t('spaces.members_banned')}
                    </button>
                )}
            </div>

            <div className="space-block-content">
                <div className="text-muted text-center">
                    {t('common.loading')}
                </div>
            </div>
        </div>
    );
};

export default SpaceMembersTab;