import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import SpaceService from '../../services/space.service';
import { SpaceContext } from '../../context/SpaceContext';

const SpaceRightSidebar = ({ currentTab }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { space, updateSpace, isAdmin } = useContext(SpaceContext);
    const [isLoading, setIsLoading] = useState(false);

    if (!space) return null;

    const spaceUrl = `/${space.username}`;
    const isOwner = space.member_role === 'owner';

    const handleMembershipToggle = async () => {
        if (space.is_member === null || isOwner) return; // Власник не може вийти
        setIsLoading(true);
        try {
            if (space.is_member) {
                await SpaceService.leaveSpace(space.username);
                updateSpace({ is_member: false, member_role: null, members_count: space.members_count - 1 });
            } else {
                await SpaceService.joinSpace(space.username);
                updateSpace({ is_member: true, member_role: 'member', members_count: space.members_count + 1 });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLinkClass = (tabName) => {
        const isActive = currentTab === tabName;
        return `block p-[6px_8px] text-[11px] text-left w-full transition-colors border-b border-border no-underline ${
            isActive ? 'bg-theme-link text-white font-bold' : 'text-theme-link hover:bg-bg-page hover:underline'
        }`;
    };

    // Фільтруємо керівників для міні-блоку
    const staffMembers = space.preview_members ? space.preview_members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role)) : [];

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="bg-bg-box border border-border p-[5px]">
                <img src={space.avatar_url} alt={space.name} className="w-full aspect-square block border border-border object-cover" />
            </div>

            <div className="flex flex-col border border-border bg-bg-box">
                <Link to={spaceUrl} className={getLinkClass('wall')}>{t('spaces.tab_wall')}</Link>
                <Link to={`${spaceUrl}?tab=members`} className={getLinkClass('members')}>{t('spaces.tab_members')}</Link>
                <Link to={`${spaceUrl}?tab=rules`} className={getLinkClass('rules')}>{t('spaces.tab_rules')}</Link>

                {isAdmin && (
                    <>
                        <Link to={`${spaceUrl}?tab=settings`} className={getLinkClass('settings')}>{t('spaces.tab_settings')}</Link>
                        <Link to={`${spaceUrl}?tab=invites`} className={getLinkClass('invites')}>{t('spaces.tab_invites')}</Link>
                        <Link to={`${spaceUrl}?tab=stats`} className={getLinkClass('stats')}>{t('spaces.tab_stats')}</Link>
                    </>
                )}

                {/* ФІКС: Кнопка "Приєднатися/Вийти" більше не відображається власнику */}
                {!isOwner && (
                    <button
                        className="block p-[6px_8px] text-theme-link text-[11px] font-bold text-center w-full hover:bg-bg-page transition-colors bg-transparent border-none cursor-pointer"
                        onClick={handleMembershipToggle}
                        disabled={isLoading}
                    >
                        {isLoading ? t('common.loading') : (space.is_member ? t('spaces.leave') : t('spaces.join'))}
                    </button>
                )}
            </div>

            {staffMembers.length > 0 && (
                <div className="bg-bg-box border border-border">
                    <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold border-b border-border">
                        {t('spaces.blocks_staff')}
                    </div>
                    <div className="p-[5px] flex flex-col gap-[5px]">
                        {staffMembers.map(staff => (
                            <Link key={staff.username} to={`/${staff.username}`} className="flex items-center gap-[8px] hover:bg-bg-page p-[4px] transition-colors no-underline border border-transparent hover:border-border">
                                <img src={staff.avatar} alt={staff.username} className="w-[24px] h-[24px] object-cover border border-border" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[11px] font-bold text-theme-link hover:underline truncate">
                                        {staff.first_name || staff.username}
                                    </span>
                                    {/* ФІКС: Виводимо кастомний бейджик або системну роль */}
                                    <span className="text-[9px] text-text-muted truncate mt-[-2px]">
                                        {staff.custom_title || t(`spaces.role_${staff.role}`)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold border-b border-border">
                    {t('spaces.privacy')}
                </div>
                <div className="p-[10px] text-text-muted text-[11px] leading-[1.4]">
                    {t(`spaces.privacy_desc_${space.privacy_type}`)}
                </div>
            </div>

            {space.links && space.links.length > 0 && (
                <div className="bg-bg-box border border-border">
                    <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold border-b border-border">
                        {t('spaces.friends_links')}
                    </div>
                    <div className="flex flex-col p-[5px]">
                        {space.links.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="p-[5px] text-[11px] text-theme-link hover:underline block truncate">
                                {link.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceRightSidebar;