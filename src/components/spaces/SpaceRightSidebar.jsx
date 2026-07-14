import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SpaceRightSidebar = ({ space, isAdmin }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleMembershipToggle = async () => {
        if (space.is_member === null) return;

        setIsLoading(true);
        try {
            if (space.is_member) {
                await SpaceService.leaveSpace(space.id);
                onMembershipChange(false);
            } else {
                await SpaceService.joinSpace(space.id);
                onMembershipChange(true);
            }
        } finally {
            setIsLoading(false);
        }
    };;

    return (
        <>
            <div className="space-block">
                <div className="space-avatar-wrapper-classic">
                    <img
                        src={space.cover_url}
                        alt={space.name}
                        className="space-main-avatar"
                    />
                </div>
            </div>

            <div className="space-action-menu">
                {isAdmin && (
                    <>
                        <button className="space-action-link">{t('spaces.menu_settings')}</button>
                        <button className="space-action-link">{t('spaces.menu_stats')}</button>
                    </>
                )}
                <button
                    className="space-action-link"
                    onClick={handleMembershipToggle}
                >
                    {space.isMember ? t('spaces.leave') : t('spaces.join')}
                </button>
            </div>

            <div className="space-block">
                <div className="space-block-header">
                    <span>{t('spaces.privacy')}</span>
                </div>
                <div className="space-block-content space-privacy-desc">
                    {t(`spaces.privacy_desc_${space.privacy_type}`)}
                </div>
            </div>

            {space.owner && (
                <div className="space-block">
                    <div className="space-block-header">
                        <span>{t('spaces.author')}</span>
                    </div>
                    <div className="space-block-content space-author-row">
                        <img
                            src={space.owner.avatar}
                            alt={space.owner.username}
                            className="space-author-avatar"
                        />
                        <span className="space-author-name">
                            {[space.owner.first_name, space.owner.last_name].filter(Boolean).join(' ') || space.owner.username}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};

export default SpaceRightSidebar;