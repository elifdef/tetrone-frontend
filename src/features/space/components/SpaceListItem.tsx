import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isSpaceStaffRole } from '@/context/space-context';
import type { SpaceData } from '@/types/space';

interface SpaceListItemProps {
    space: SpaceData;
    onLeave: (spaceUsername: string) => void;
}

const SpaceListItem = ({ space, onLeave }: SpaceListItemProps) => {
    const { t } = useTranslation();

    const isOwner = space.member_role === 'owner';
    const isStaff = isSpaceStaffRole(space.member_role);
    const privacyType = space.privacy_type ?? 'public';

    return (
        <div className="flex items-start bg-bg-box border border-border p-[10px] gap-[12px] hover:bg-bg-page transition-colors max-md:flex-col max-md:items-center max-md:text-center">
            <Link to={`/${space.username}`} className="shrink-0 p-[2px] bg-bg-page border border-border">
                <img
                    src={space.avatar ?? undefined}
                    alt={space.name}
                    className="w-[75px] h-[75px] object-cover block"
                />
            </Link>

            <div className="flex-1 min-w-0 flex flex-col gap-[4px] text-[11px] text-text-main">
                <div className="flex items-baseline gap-[6px] flex-wrap max-md:justify-center">
                    <Link to={`/${space.username}`} className="font-bold text-[12px] text-theme-link hover:underline truncate">
                        {space.name}
                    </Link>
                    <span className="text-[10px] text-text-muted">@{space.username}</span>
                </div>

                <div className="flex max-md:justify-center">
                    <span className="w-[95px] shrink-0 text-text-muted max-md:w-auto max-md:mr-[4px]">{t('spaces.info_type')}:</span>
                    <span>{t(`spaces.privacy_${privacyType}`)}</span>
                </div>

                <div className="flex max-md:justify-center">
                    <span className="w-[95px] shrink-0 text-text-muted max-md:w-auto max-md:mr-[4px]">{t('spaces.blocks_members')}:</span>
                    <Link to={`/${space.username}?tab=members`} className="text-theme-link hover:underline">
                        {t('entities.member', { count: space.members_count })}
                    </Link>
                </div>

                {isStaff && space.member_role && (
                    <div className="flex max-md:justify-center">
                        <span className="w-[95px] shrink-0 text-text-muted max-md:w-auto max-md:mr-[4px]">{t('spaces.blocks_staff')}:</span>
                        <span className="font-bold text-theme-link">{t(`spaces.role_${space.member_role}`)}</span>
                    </div>
                )}
            </div>

            <div className="w-[160px] shrink-0 flex flex-col border-l border-border pl-[10px] max-md:w-full max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-[8px] max-md:flex-row max-md:justify-center max-md:gap-[12px]">
                <Link
                    className="block py-[4px] px-[6px] text-theme-link text-[11px] font-bold border-b border-border hover:bg-bg-box hover:underline no-underline max-md:border-none"
                    to={`/${space.username}`}
                >
                    {t('spaces.visit')}
                </Link>
                {isOwner && (
                    <Link
                        className="block py-[4px] px-[6px] text-theme-link text-[11px] border-b border-border hover:bg-bg-box hover:underline no-underline max-md:border-none"
                        to={`/${space.username}?tab=settings`}
                    >
                        {t('spaces.settings')}
                    </Link>
                )}
                {!isOwner && space.is_member && (
                    <button
                        type="button"
                        className="block text-left py-[4px] px-[6px] text-theme-link text-[11px] border-none bg-transparent cursor-pointer hover:bg-bg-box hover:underline max-md:text-center"
                        onClick={() => onLeave(space.username)}
                    >
                        {t('spaces.leave')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpaceListItem;