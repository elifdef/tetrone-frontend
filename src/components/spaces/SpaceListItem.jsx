import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const SpaceListItem = ({ space, onLeave }) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);

    // Власник або адмін
    const canManage = space.owner?.username === user?.username || space.member_role === 'admin';

    return (
        <div className="flex bg-bg-box border border-border p-[10px] gap-[15px] hover:bg-bg-page transition-colors max-md:flex-col max-md:gap-[10px]">
            <Link to={`/${space.username}`} className="shrink-0 max-md:mx-auto">
                <img
                    src={space.avatar_url}
                    alt={space.name}
                    className="w-[80px] h-[80px] object-cover border border-border"
                />
            </Link>

            <div className="flex-1 flex flex-col gap-[5px] text-[12px] text-text-main max-md:text-center">
                <div className="flex max-md:justify-center">
                    <Link to={`/${space.username}`} className="font-bold text-theme-link hover:underline">
                        {space.name}
                    </Link>
                </div>
                <div className="flex text-[11px] max-md:justify-center">
                    <span className="text-text-muted mr-[5px]">{t('spaces.info_type')}:</span>
                    <span>{t(`spaces.privacy_${space.privacy_type}`)}</span>
                </div>
                <div className="flex text-[11px] max-md:justify-center">
                    <span className="text-text-muted mr-[5px]">{t('spaces.blocks_members')}:</span>
                    <Link to={`/${space.username}?tab=members`} className="text-theme-link hover:underline font-bold">
                        {t('entities.member', { count: space.members_count })}
                    </Link>
                </div>
            </div>

            <div className="w-[180px] shrink-0 flex flex-col border-l border-border pl-[15px] max-md:w-full max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-[10px] max-md:flex-row max-md:justify-center max-md:gap-[15px]">
                <Link className="text-theme-link text-[11px] py-[4px] border-b border-border hover:underline max-md:border-none" to={`/${space.username}`}>
                    {t('spaces.visit')}
                </Link>
                {canManage && (
                    <Link className="text-theme-link text-[11px] py-[4px] border-b border-border hover:underline max-md:border-none" to={`/${space.username}?tab=settings`}>
                        {t('spaces.settings')}
                    </Link>
                )}
                {!canManage && space.is_member && (
                    <button className="text-theme-link text-[11px] py-[4px] border-none bg-transparent text-left cursor-pointer hover:underline max-md:border-none" onClick={() => onLeave(space.username)}>
                        {t('spaces.leave')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpaceListItem;